// src/handlers/agent.js
// Boucle agentique : Claude ↔ outils busGO (multi-turn tool_use)

const Anthropic    = require('@anthropic-ai/sdk');
const TOOLS        = require('../tools/definitions');
const { executeTool } = require('../tools/executor');
const memory       = require('../memory/conversationMemory');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es BusBot, l'assistant intelligent de la plateforme busGO — service de vente de billets de bus en France.

Tu aides les utilisateurs à :
- Trouver des trajets de bus entre les grandes villes françaises
- Comparer les prix, horaires et compagnies
- Réserver des billets (avec confirmation explicite avant toute réservation)
- Gérer leurs réservations existantes (consulter, annuler)

Villes disponibles : Paris, Lyon, Marseille, Bordeaux, Toulouse, Nice, Nantes, Lille, Strasbourg.

RÈGLES IMPORTANTES :
1. Toujours confirmer avec l'utilisateur AVANT de créer ou annuler une réservation.
   Exemple : "Je vais réserver le trajet Paris→Lyon du 20/03 à 07h15, siège 5A pour 12,99€. Vous confirmez ?"
2. Quand tu affiches des trajets, présente-les de façon claire et lisible avec les horaires, prix et compagnie.
3. Pour choisir un siège, préfère les premiers sièges libres disponibles sauf si l'utilisateur précise une préférence.
4. Réponds toujours en français.
5. Si l'API est indisponible, informe l'utilisateur avec courtoisie.
6. Sois concis et conversationnel — tu es dans Telegram, pas dans un formulaire.

FORMAT DES RÉPONSES (Telegram Markdown) :
- Utilise *gras* pour les informations importantes
- Utilise des emojis pertinents pour la lisibilité
- Structure les listes de trajets clairement
- Ajoute toujours le prix total (billet + frais 1,99€) dans les confirmations`;

// Nombre max d'itérations de la boucle (sécurité anti-boucle infinie)
const MAX_ITERATIONS = 10;

/**
 * Traiter un message utilisateur et retourner la réponse de l'agent.
 * Gère la boucle agentique complète avec tool_use.
 *
 * @param {string|number} userId  - ID Telegram de l'utilisateur
 * @param {string}        userMsg - Message texte de l'utilisateur
 * @returns {string} - Réponse finale en markdown Telegram
 */
async function processMessage(userId, userMsg) {
  // 1. Ajouter le message utilisateur à la mémoire
  memory.addUserMessage(userId, userMsg);

  const messages = memory.getMessages(userId);

  let iterations = 0;
  let finalResponse = null;

  // 2. Boucle agentique
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`\n🔄 Iteration ${iterations} — userId: ${userId}`);

    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 2048,
      system:     SYSTEM_PROMPT,
      tools:      TOOLS,
      messages,
    });

    console.log(`   stop_reason: ${response.stop_reason}`);

    // 3. Si Claude a terminé → extraire le texte final
    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text');
      finalResponse = textBlock?.text || 'Je n\'ai pas pu générer de réponse.';

      // Sauvegarder la réponse dans la mémoire
      memory.addAssistantMessage(userId, finalResponse);
      break;
    }

    // 4. Si Claude veut utiliser des outils
    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

      // Ajouter la réponse de Claude (avec les tool_use) dans l'historique
      memory.addRawMessages(userId, [
        { role: 'assistant', content: response.content },
      ]);

      // Exécuter tous les outils demandés en parallèle
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolBlock) => {
          const result = await executeTool(toolBlock.name, toolBlock.input);
          return {
            type:        'tool_result',
            tool_use_id: toolBlock.id,
            content:     JSON.stringify(result),
          };
        })
      );

      // Ajouter les résultats des outils dans l'historique
      memory.addRawMessages(userId, [
        { role: 'user', content: toolResults },
      ]);

      // Mettre à jour le contexte de session avec les infos pertinentes
      _updateContextFromTools(userId, toolUseBlocks, toolResults);

      // Récupérer les messages mis à jour pour la prochaine itération
      messages.length = 0;
      messages.push(...memory.getMessages(userId));
      continue;
    }

    // Stop inattendu
    console.warn('   ⚠️  Unexpected stop_reason:', response.stop_reason);
    finalResponse = 'Une erreur inattendue s\'est produite.';
    break;
  }

  if (!finalResponse) {
    finalResponse = 'Désolé, j\'ai atteint la limite de traitement. Veuillez reformuler votre demande.';
  }

  return finalResponse;
}

// Mettre à jour le contexte session avec les infos extraites des appels d'outils
function _updateContextFromTools(userId, toolUseBlocks, toolResults) {
  for (let i = 0; i < toolUseBlocks.length; i++) {
    const tool = toolUseBlocks[i];
    let result;
    try { result = JSON.parse(toolResults[i].content); } catch { continue; }

    if (tool.name === 'search_trips' && result.trips?.length > 0) {
      memory.updateContext(userId, {
        preferredFrom: tool.input.from,
        preferredTo:   tool.input.to,
        lastTripId:    result.trips[0].id,
      });
    }

    if (tool.name === 'create_booking' && result.booking?.id) {
      memory.updateContext(userId, {
        lastBookingId: result.booking.id,
      });
    }
  }
}

module.exports = { processMessage };
