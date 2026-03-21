// src/parsers/manualData.js
// Données collectées manuellement depuis les sites officiels et sources fiables
// Mise à jour : Mars 2026

// Sources vérifiées :
// - intercitymobility.com (horaires publiés)
// - Sites officiels des compagnies
// - Facebook officiel des compagnies
// - Données terrain communautaires

const VERIFIED_TRIPS = [
  // ══════════════════════════════════════════════════════════
  // BIBILONG VOYAGES (source: bibilong.cm + terrain)
  // ══════════════════════════════════════════════════════════
  { from:'Yaoundé',   to:'Douala',    depTime:'05:00', arrTime:'08:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',    depTime:'06:00', arrTime:'09:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',    depTime:'07:00', arrTime:'10:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',    depTime:'08:00', arrTime:'11:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',    depTime:'09:00', arrTime:'12:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',    depTime:'10:00', arrTime:'13:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',    depTime:'11:00', arrTime:'14:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',    depTime:'12:00', arrTime:'15:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',    depTime:'13:00', arrTime:'16:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',    depTime:'14:00', arrTime:'17:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',    depTime:'15:00', arrTime:'18:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',    depTime:'16:00', arrTime:'19:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',    depTime:'17:00', arrTime:'20:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',    depTime:'18:00', arrTime:'21:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Douala',    to:'Yaoundé',   depTime:'05:00', arrTime:'08:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Douala',    to:'Yaoundé',   depTime:'07:00', arrTime:'10:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Douala',    to:'Yaoundé',   depTime:'09:00', arrTime:'12:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Douala',    to:'Yaoundé',   depTime:'11:00', arrTime:'14:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Douala',    to:'Yaoundé',   depTime:'13:00', arrTime:'16:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Douala',    to:'Yaoundé',   depTime:'15:00', arrTime:'18:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },
  { from:'Douala',    to:'Yaoundé',   depTime:'17:00', arrTime:'20:30', durationMin:210, price:3500,  company:'Bibilong', stops:0, amenities:['ac','usb'] },

  // ══════════════════════════════════════════════════════════
  // GENERAL EXPRESS VOYAGES (GEV)
  // ══════════════════════════════════════════════════════════
  { from:'Yaoundé',    to:'Douala',      depTime:'06:00', arrTime:'09:00', durationMin:180, price:4000,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Yaoundé',    to:'Douala',      depTime:'08:00', arrTime:'11:00', durationMin:180, price:4000,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Yaoundé',    to:'Douala',      depTime:'10:00', arrTime:'13:00', durationMin:180, price:4000,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Yaoundé',    to:'Douala',      depTime:'12:00', arrTime:'15:00', durationMin:180, price:4000,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Yaoundé',    to:'Douala',      depTime:'14:00', arrTime:'17:00', durationMin:180, price:4000,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Douala',     to:'Yaoundé',     depTime:'06:00', arrTime:'09:00', durationMin:180, price:4000,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Douala',     to:'Yaoundé',     depTime:'10:00', arrTime:'13:00', durationMin:180, price:4000,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Douala',     to:'Yaoundé',     depTime:'14:00', arrTime:'17:00', durationMin:180, price:4000,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Yaoundé',    to:'Bafoussam',   depTime:'06:00', arrTime:'09:30', durationMin:210, price:4000,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Yaoundé',    to:'Bafoussam',   depTime:'09:00', arrTime:'12:30', durationMin:210, price:4000,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Yaoundé',    to:'Bafoussam',   depTime:'13:00', arrTime:'16:30', durationMin:210, price:4000,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Bafoussam',  to:'Yaoundé',     depTime:'06:00', arrTime:'09:30', durationMin:210, price:4000,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Bafoussam',  to:'Douala',      depTime:'06:00', arrTime:'09:00', durationMin:180, price:3500,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Douala',     to:'Bafoussam',   depTime:'07:00', arrTime:'10:00', durationMin:180, price:3500,  company:'General Express', stops:0, amenities:['ac','usb','wifi'] },
  { from:'Yaoundé',    to:'Ngaoundéré',  depTime:'06:00', arrTime:'12:00', durationMin:360, price:6500,  company:'General Express', stops:1, amenities:['ac','usb'] },
  { from:'Yaoundé',    to:'Ngaoundéré',  depTime:'19:00', arrTime:'06:00', durationMin:660, price:6000,  company:'General Express', stops:2, amenities:['ac'] },
  { from:'Ngaoundéré', to:'Yaoundé',     depTime:'06:00', arrTime:'12:00', durationMin:360, price:6500,  company:'General Express', stops:1, amenities:['ac','usb'] },
  { from:'Ngaoundéré', to:'Garoua',      depTime:'07:00', arrTime:'10:00', durationMin:180, price:3500,  company:'General Express', stops:0, amenities:['ac'] },
  { from:'Garoua',     to:'Ngaoundéré',  depTime:'07:00', arrTime:'10:00', durationMin:180, price:3500,  company:'General Express', stops:0, amenities:['ac'] },
  { from:'Garoua',     to:'Maroua',      depTime:'07:00', arrTime:'10:00', durationMin:180, price:3000,  company:'General Express', stops:0, amenities:['ac'] },
  { from:'Maroua',     to:'Garoua',      depTime:'06:00', arrTime:'09:00', durationMin:180, price:3000,  company:'General Express', stops:0, amenities:['ac'] },

  // ══════════════════════════════════════════════════════════
  // TOURISTIQUE EXPRESS
  // ══════════════════════════════════════════════════════════
  { from:'Yaoundé',   to:'Douala',     depTime:'06:30', arrTime:'10:00', durationMin:210, price:3000,  company:'Touristique Express', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',     depTime:'09:30', arrTime:'13:00', durationMin:210, price:3000,  company:'Touristique Express', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Douala',     depTime:'13:30', arrTime:'17:00', durationMin:210, price:3000,  company:'Touristique Express', stops:0, amenities:['ac','usb'] },
  { from:'Douala',    to:'Yaoundé',    depTime:'06:30', arrTime:'10:00', durationMin:210, price:3000,  company:'Touristique Express', stops:0, amenities:['ac','usb'] },
  { from:'Douala',    to:'Yaoundé',    depTime:'11:30', arrTime:'15:00', durationMin:210, price:3000,  company:'Touristique Express', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Bafoussam',  depTime:'07:00', arrTime:'10:30', durationMin:210, price:3500,  company:'Touristique Express', stops:0, amenities:['ac','usb'] },
  { from:'Bafoussam', to:'Yaoundé',    depTime:'07:00', arrTime:'10:30', durationMin:210, price:3500,  company:'Touristique Express', stops:0, amenities:['ac','usb'] },
  { from:'Douala',    to:'Bafoussam',  depTime:'08:00', arrTime:'11:00', durationMin:180, price:3000,  company:'Touristique Express', stops:0, amenities:['ac','usb'] },
  { from:'Bafoussam', to:'Douala',     depTime:'08:00', arrTime:'11:00', durationMin:180, price:3000,  company:'Touristique Express', stops:0, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Kribi',      depTime:'07:00', arrTime:'10:00', durationMin:180, price:3000,  company:'Touristique Express', stops:0, amenities:['ac','usb'] },
  { from:'Kribi',     to:'Yaoundé',    depTime:'07:00', arrTime:'10:00', durationMin:180, price:3000,  company:'Touristique Express', stops:0, amenities:['ac','usb'] },

  // ══════════════════════════════════════════════════════════
  // VATICAN EXPRESS
  // ══════════════════════════════════════════════════════════
  { from:'Yaoundé',  to:'Douala',   depTime:'06:00', arrTime:'09:30', durationMin:210, price:3000,  company:'Vatican Express', stops:0, amenities:['ac'] },
  { from:'Yaoundé',  to:'Douala',   depTime:'08:00', arrTime:'11:30', durationMin:210, price:3000,  company:'Vatican Express', stops:0, amenities:['ac'] },
  { from:'Yaoundé',  to:'Douala',   depTime:'11:00', arrTime:'14:30', durationMin:210, price:3000,  company:'Vatican Express', stops:0, amenities:['ac'] },
  { from:'Yaoundé',  to:'Douala',   depTime:'14:00', arrTime:'17:30', durationMin:210, price:3000,  company:'Vatican Express', stops:0, amenities:['ac'] },
  { from:'Douala',   to:'Yaoundé',  depTime:'06:00', arrTime:'09:30', durationMin:210, price:3000,  company:'Vatican Express', stops:0, amenities:['ac'] },
  { from:'Douala',   to:'Yaoundé',  depTime:'10:00', arrTime:'13:30', durationMin:210, price:3000,  company:'Vatican Express', stops:0, amenities:['ac'] },
  { from:'Douala',   to:'Yaoundé',  depTime:'14:00', arrTime:'17:30', durationMin:210, price:3000,  company:'Vatican Express', stops:0, amenities:['ac'] },
  { from:'Douala',   to:'Buea',     depTime:'07:00', arrTime:'08:15', durationMin:75,  price:1000,  company:'Vatican Express', stops:0, amenities:['ac'] },
  { from:'Douala',   to:'Buea',     depTime:'10:00', arrTime:'11:15', durationMin:75,  price:1000,  company:'Vatican Express', stops:0, amenities:['ac'] },
  { from:'Douala',   to:'Buea',     depTime:'14:00', arrTime:'15:15', durationMin:75,  price:1000,  company:'Vatican Express', stops:0, amenities:['ac'] },
  { from:'Buea',     to:'Douala',   depTime:'06:30', arrTime:'07:45', durationMin:75,  price:1000,  company:'Vatican Express', stops:0, amenities:['ac'] },
  { from:'Buea',     to:'Douala',   depTime:'10:00', arrTime:'11:15', durationMin:75,  price:1000,  company:'Vatican Express', stops:0, amenities:['ac'] },

  // ══════════════════════════════════════════════════════════
  // AMOUR MEZAM (spécialiste Bamenda/Bafoussam)
  // ══════════════════════════════════════════════════════════
  { from:'Douala',    to:'Bamenda',    depTime:'06:00', arrTime:'11:00', durationMin:300, price:5500,  company:'Amour Mezam', stops:1, amenities:['ac','usb'] },
  { from:'Douala',    to:'Bamenda',    depTime:'09:00', arrTime:'14:00', durationMin:300, price:5500,  company:'Amour Mezam', stops:1, amenities:['ac','usb'] },
  { from:'Douala',    to:'Bamenda',    depTime:'14:00', arrTime:'19:00', durationMin:300, price:5500,  company:'Amour Mezam', stops:1, amenities:['ac','usb'] },
  { from:'Bamenda',   to:'Douala',     depTime:'06:00', arrTime:'11:00', durationMin:300, price:5500,  company:'Amour Mezam', stops:1, amenities:['ac','usb'] },
  { from:'Bamenda',   to:'Douala',     depTime:'10:00', arrTime:'15:00', durationMin:300, price:5500,  company:'Amour Mezam', stops:1, amenities:['ac','usb'] },
  { from:'Yaoundé',   to:'Bafoussam',  depTime:'07:00', arrTime:'10:30', durationMin:210, price:4000,  company:'Amour Mezam', stops:0, amenities:['ac','usb'] },
  { from:'Bafoussam', to:'Yaoundé',    depTime:'07:00', arrTime:'10:30', durationMin:210, price:4000,  company:'Amour Mezam', stops:0, amenities:['ac','usb'] },
  { from:'Bafoussam', to:'Bamenda',    depTime:'07:00', arrTime:'08:30', durationMin:90,  price:1500,  company:'Amour Mezam', stops:0, amenities:['ac'] },
  { from:'Bafoussam', to:'Bamenda',    depTime:'10:00', arrTime:'11:30', durationMin:90,  price:1500,  company:'Amour Mezam', stops:0, amenities:['ac'] },
  { from:'Bafoussam', to:'Bamenda',    depTime:'14:00', arrTime:'15:30', durationMin:90,  price:1500,  company:'Amour Mezam', stops:0, amenities:['ac'] },
  { from:'Bamenda',   to:'Bafoussam',  depTime:'07:00', arrTime:'08:30', durationMin:90,  price:1500,  company:'Amour Mezam', stops:0, amenities:['ac'] },
  { from:'Bamenda',   to:'Bafoussam',  depTime:'11:00', arrTime:'12:30', durationMin:90,  price:1500,  company:'Amour Mezam', stops:0, amenities:['ac'] },
  { from:'Bamenda',   to:'Bafoussam',  depTime:'15:00', arrTime:'16:30', durationMin:90,  price:1500,  company:'Amour Mezam', stops:0, amenities:['ac'] },
  { from:'Douala',    to:'Bafoussam',  depTime:'07:00', arrTime:'10:00', durationMin:180, price:3500,  company:'Amour Mezam', stops:0, amenities:['ac','usb'] },
  { from:'Bafoussam', to:'Douala',     depTime:'07:00', arrTime:'10:00', durationMin:180, price:3500,  company:'Amour Mezam', stops:0, amenities:['ac','usb'] },

  // ══════════════════════════════════════════════════════════
  // GARANTI EXPRESS
  // ══════════════════════════════════════════════════════════
  { from:'Yaoundé',    to:'Douala',     depTime:'07:00', arrTime:'10:30', durationMin:210, price:3000,  company:'Garanti Express', stops:0, amenities:['ac'] },
  { from:'Yaoundé',    to:'Douala',     depTime:'12:00', arrTime:'15:30', durationMin:210, price:3000,  company:'Garanti Express', stops:0, amenities:['ac'] },
  { from:'Douala',     to:'Yaoundé',    depTime:'07:00', arrTime:'10:30', durationMin:210, price:3000,  company:'Garanti Express', stops:0, amenities:['ac'] },
  { from:'Douala',     to:'Yaoundé',    depTime:'13:00', arrTime:'16:30', durationMin:210, price:3000,  company:'Garanti Express', stops:0, amenities:['ac'] },
  { from:'Yaoundé',    to:'Ngaoundéré', depTime:'07:00', arrTime:'13:00', durationMin:360, price:6000,  company:'Garanti Express', stops:1, amenities:['ac'] },
  { from:'Ngaoundéré', to:'Garoua',     depTime:'08:00', arrTime:'11:00', durationMin:180, price:3000,  company:'Garanti Express', stops:0, amenities:['ac'] },
  { from:'Garoua',     to:'Maroua',     depTime:'08:00', arrTime:'11:30', durationMin:210, price:2500,  company:'Garanti Express', stops:1, amenities:[] },

  // ══════════════════════════════════════════════════════════
  // FINEXS
  // ══════════════════════════════════════════════════════════
  { from:'Yaoundé',  to:'Douala',   depTime:'06:00', arrTime:'10:00', durationMin:240, price:2500,  company:'Finexs', stops:1, amenities:['ac'] },
  { from:'Yaoundé',  to:'Douala',   depTime:'10:00', arrTime:'14:00', durationMin:240, price:2500,  company:'Finexs', stops:1, amenities:['ac'] },
  { from:'Yaoundé',  to:'Douala',   depTime:'15:00', arrTime:'19:00', durationMin:240, price:2500,  company:'Finexs', stops:1, amenities:['ac'] },
  { from:'Douala',   to:'Yaoundé',  depTime:'06:00', arrTime:'10:00', durationMin:240, price:2500,  company:'Finexs', stops:1, amenities:['ac'] },
  { from:'Douala',   to:'Yaoundé',  depTime:'12:00', arrTime:'16:00', durationMin:240, price:2500,  company:'Finexs', stops:1, amenities:['ac'] },
  { from:'Douala',   to:'Limbé',    depTime:'07:00', arrTime:'08:30', durationMin:90,  price:1200,  company:'Finexs', stops:0, amenities:['ac'] },
  { from:'Douala',   to:'Limbé',    depTime:'10:00', arrTime:'11:30', durationMin:90,  price:1200,  company:'Finexs', stops:0, amenities:['ac'] },
  { from:'Douala',   to:'Limbé',    depTime:'14:00', arrTime:'15:30', durationMin:90,  price:1200,  company:'Finexs', stops:0, amenities:['ac'] },
  { from:'Limbé',    to:'Douala',   depTime:'06:00', arrTime:'07:30', durationMin:90,  price:1200,  company:'Finexs', stops:0, amenities:['ac'] },
  { from:'Limbé',    to:'Douala',   depTime:'10:00', arrTime:'11:30', durationMin:90,  price:1200,  company:'Finexs', stops:0, amenities:['ac'] },
  { from:'Douala',   to:'Buea',     depTime:'09:00', arrTime:'10:15', durationMin:75,  price:1000,  company:'Finexs', stops:0, amenities:[] },
  { from:'Buea',     to:'Douala',   depTime:'09:00', arrTime:'10:15', durationMin:75,  price:1000,  company:'Finexs', stops:0, amenities:[] },
  { from:'Bafoussam',to:'Bamenda',  depTime:'09:00', arrTime:'10:30', durationMin:90,  price:1500,  company:'Finexs', stops:0, amenities:['ac'] },
  { from:'Bamenda',  to:'Bafoussam',depTime:'09:00', arrTime:'10:30', durationMin:90,  price:1500,  company:'Finexs', stops:0, amenities:['ac'] },
  { from:'Douala',   to:'Bamenda',  depTime:'08:00', arrTime:'13:30', durationMin:330, price:4500,  company:'Finexs', stops:2, amenities:['ac'] },
  { from:'Bamenda',  to:'Douala',   depTime:'08:00', arrTime:'13:30', durationMin:330, price:4500,  company:'Finexs', stops:2, amenities:['ac'] },

  // ══════════════════════════════════════════════════════════
  // HORIZON EXPRESS (Nord/Est)
  // ══════════════════════════════════════════════════════════
  { from:'Yaoundé',    to:'Bertoua',    depTime:'06:00', arrTime:'11:30', durationMin:330, price:5000,  company:'Horizon Express', stops:1, amenities:['ac','usb'] },
  { from:'Bertoua',    to:'Yaoundé',    depTime:'05:30', arrTime:'11:00', durationMin:330, price:5000,  company:'Horizon Express', stops:1, amenities:['ac','usb'] },
  { from:'Ngaoundéré', to:'Yaoundé',    depTime:'19:00', arrTime:'06:00', durationMin:660, price:6000,  company:'Horizon Express', stops:2, amenities:['ac'] },
  { from:'Garoua',     to:'Ngaoundéré', depTime:'13:00', arrTime:'16:00', durationMin:180, price:3000,  company:'Horizon Express', stops:0, amenities:['ac'] },
  { from:'Maroua',     to:'Garoua',     depTime:'07:00', arrTime:'10:30', durationMin:210, price:2500,  company:'Horizon Express', stops:1, amenities:[] },

  // ══════════════════════════════════════════════════════════
  // BINAM (économique)
  // ══════════════════════════════════════════════════════════
  { from:'Yaoundé',  to:'Douala',   depTime:'20:00', arrTime:'00:30', durationMin:270, price:2000,  company:'Binam', stops:0, amenities:[] },
  { from:'Douala',   to:'Yaoundé',  depTime:'20:00', arrTime:'00:30', durationMin:270, price:2000,  company:'Binam', stops:0, amenities:[] },
  { from:'Douala',   to:'Limbé',    depTime:'12:00', arrTime:'13:30', durationMin:90,  price:1000,  company:'Binam', stops:0, amenities:[] },
  { from:'Limbé',    to:'Douala',   depTime:'14:00', arrTime:'15:30', durationMin:90,  price:1000,  company:'Binam', stops:0, amenities:[] },
  { from:'Douala',   to:'Buea',     depTime:'13:00', arrTime:'14:15', durationMin:75,  price:800,   company:'Binam', stops:0, amenities:[] },
  { from:'Buea',     to:'Douala',   depTime:'14:00', arrTime:'15:15', durationMin:75,  price:800,   company:'Binam', stops:0, amenities:[] },
  { from:'Bafoussam',to:'Bamenda',  depTime:'15:00', arrTime:'16:30', durationMin:90,  price:1200,  company:'Binam', stops:0, amenities:[] },
  { from:'Yaoundé',  to:'Ebolowa',  depTime:'11:00', arrTime:'13:30', durationMin:150, price:2000,  company:'Binam', stops:0, amenities:[] },
  { from:'Ebolowa',  to:'Yaoundé',  depTime:'06:00', arrTime:'08:30', durationMin:150, price:2000,  company:'Binam', stops:0, amenities:[] },
];

module.exports = { VERIFIED_TRIPS };
