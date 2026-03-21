// src/memory/conversationMemory.js
// Gestion de la mémoire de conversation par utilisateur Telegram
// Stockage en mémoire (remplacer par Redis en production)

const MAX_MESSAGES = 20;    // Garder les N derniers messages
const TTL_MS = 30 * 60 * 1000; // 30 minutes d'inactivité → reset

class ConversationMemory {
  constructor() {
    this.sessions = new Map(); // userId -> { messages, lastActivity, context }
  }

  _getOrCreate(userId) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        messages:     [],
        lastActivity: Date.now(),
        context: {
          // Ce qu'on sait sur l'utilisateur dans cette session
          preferredFrom: null,
          preferredTo:   null,
          lastTripId:    null,
          lastBookingId: null,
          pendingAction: null, // ex: { type: 'confirm_booking', data: {...} }
        },
      });
    }
    return this.sessions.get(userId);
  }

  // Retourner les messages pour l'API Claude
  getMessages(userId) {
    const session = this._getOrCreate(userId);
    const now = Date.now();

    // Reset si inactif depuis trop longtemps
    if (now - session.lastActivity > TTL_MS && session.messages.length > 0) {
      console.log(`♻️  Reset session for user ${userId} (TTL expired)`);
      this.reset(userId);
      return [];
    }

    session.lastActivity = now;
    return session.messages;
  }

  addUserMessage(userId, content) {
    const session = this._getOrCreate(userId);
    session.messages.push({ role: 'user', content });
    session.lastActivity = Date.now();
    this._trim(userId);
  }

  addAssistantMessage(userId, content) {
    const session = this._getOrCreate(userId);
    session.messages.push({ role: 'assistant', content });
    session.lastActivity = Date.now();
    this._trim(userId);
  }

  // Pour les échanges tool_use / tool_result (format Anthropic multi-turn)
  addRawMessages(userId, messages) {
    const session = this._getOrCreate(userId);
    session.messages.push(...messages);
    session.lastActivity = Date.now();
    this._trim(userId);
  }

  getContext(userId) {
    return this._getOrCreate(userId).context;
  }

  updateContext(userId, patch) {
    const session = this._getOrCreate(userId);
    Object.assign(session.context, patch);
  }

  reset(userId) {
    this.sessions.delete(userId);
  }

  _trim(userId) {
    const session = this.sessions.get(userId);
    if (!session) return;
    // Garder uniquement les MAX_MESSAGES derniers messages
    // Toujours garder les paires (user+assistant) pour cohérence
    if (session.messages.length > MAX_MESSAGES) {
      session.messages = session.messages.slice(-MAX_MESSAGES);
    }
  }

  // Stats pour debugging
  stats() {
    return {
      activeSessions: this.sessions.size,
      sessions: [...this.sessions.entries()].map(([id, s]) => ({
        userId: id,
        messageCount: s.messages.length,
        lastActivity: new Date(s.lastActivity).toISOString(),
        context: s.context,
      })),
    };
  }
}

// Singleton
module.exports = new ConversationMemory();
