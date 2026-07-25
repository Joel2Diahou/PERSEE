// backend/services/groqService.js
const Groq = require('groq-sdk');
const { searchWeb, needsWebSearch } = require('./searchService');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function orientationChat(userMessage, niveau, historique = []) {
    try {
        const formattedHistory = [];
        for (const msg of historique) {
            if (msg.role === 'user') {
                formattedHistory.push({ role: 'user', content: msg.content });
            } else if (msg.role === 'assistant' || msg.role === 'ai') {
                formattedHistory.push({ role: 'assistant', content: msg.content });
            }
        }

        // ============ DÉTECTION DE BESOIN DE RECHERCHE ============
        const searchNeeded = needsWebSearch(userMessage);
        let searchResults = '';
        let searchPerformed = false;

        if (searchNeeded) {
            console.log(`🔍 Recherche web pour: "${userMessage}"`);
            const result = await searchWeb(userMessage + " Côte d'Ivoire");
            if (result && result.answer) {
                searchResults = result.answer;
                searchPerformed = true;
                console.log('✅ Résultats trouvés');
            } else {
                console.log('⚠️ Aucun résultat trouvé');
            }
        }

        // ============ CONSTRUCTION DU PROMPT AVEC FORMATAGE ============
        let systemContent = `Tu es un conseiller d'orientation pour SCHOOL+ CI. Tu parles à un élève ivoirien de niveau ${niveau}.

🌍 **ADAPTATION CÔTE D'IVOIRE** :

1️⃣ **FORMATAGE DES RÉPONSES (TRÈS IMPORTANT)** :
   - Utilise des titres avec **gras** comme **📌 Sites utiles** ou **💼 Métiers recommandés**
   - Utilise des puces • pour les listes
   - Mets les liens entre < > pour qu'ils soient cliquables (ex: <https://www.wiijob.com>)
   - Sépare les sections avec des lignes vides
   - Utilise des émojis pour rendre la réponse vivante
   - Structure comme un vrai article ou guide

2️⃣ **EXEMPLE DE STRUCTURE** :

**📌 Sites pour trouver un emploi en Côte d'Ivoire**

Voici quelques plateformes où tu peux chercher :

• **Wiijob** - Plateforme de placement généraliste
  <https://www.wiijob.com>

• **Novojob** - Offres dans la santé et l'éducation
  <https://www.novojob.com>

💡 **Conseil** : Mets à jour ton CV régulièrement.

3️⃣ **PERSONNALITÉ** :
   - Bienveillant, chaleureux, parle comme un grand frère/une grande sœur
   - Utilise des phrases courtes et des émojis 😊

4️⃣ **CONTENU ADAPTÉ AU NIVEAU** :
   - 3ème : Parle des filières au lycée
   - Terminale : Parle des filières universitaires`;

        if (searchPerformed && searchResults) {
            systemContent += `\n\n📊 **RECHERCHE WEB EFFECTUÉE** :
Voici les informations que j'ai trouvées pour toi :

${searchResults}

Utilise ces informations pour répondre à l'élève. Formate les réponses de manière claire et structurée avec des titres, des puces et des liens cliquables. Si tu trouves des sites web, mets-les entre < >.`;
        }

        const messages = [
            {
                role: "system",
                content: systemContent
            },
            ...formattedHistory,
            {
                role: "user",
                content: userMessage
            }
        ];

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.1-8b-instant",
            temperature: 0.8,
            max_tokens: 700
        });

        return {
            success: true,
            response: completion.choices[0].message.content,
            searchPerformed: searchPerformed,
            searchResults: searchPerformed ? searchResults : null
        };
    } catch (error) {
        console.error('Erreur Groq:', error.response?.data || error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

async function recommendSchools(profil, niveau, ville) {
    try {
        const villesCI = {
            'abidjan': 'Abidjan',
            'bouake': 'Bouaké', 
            'yamoussoukro': 'Yamoussoukro',
            'daloa': 'Daloa',
            'san pedro': 'San Pedro',
            'korhogo': 'Korhogo'
        };
        
        const villeNorm = villesCI[ville?.toLowerCase()] || ville || 'Abidjan';
        
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Tu es un expert des écoles en Côte d'Ivoire. Sois court et précis. Donne 2 écoles maximum."
                },
                {
                    role: "user",
                    content: `Pour un élève de ${niveau} qui aime "${profil}", situé à ${villeNorm} en Côte d'Ivoire, donne 2 écoles recommandées avec leurs quartiers et filières.`
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.6,
            max_tokens: 180
        });

        return {
            success: true,
            recommendations: completion.choices[0].message.content
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = { orientationChat, recommendSchools };