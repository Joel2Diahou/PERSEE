// backend/services/searchService.js
const axios = require('axios');

// Clé API Tavily (à mettre dans .env)
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// Fonction de recherche web
async function searchWeb(query) {
    try {
        // Si pas de clé API, retourner une erreur
        if (!TAVILY_API_KEY) {
            console.warn('⚠️ TAVILY_API_KEY manquante. La recherche web est désactivée.');
            return null;
        }

        console.log(`🔍 Recherche Tavily: "${query}"...`);
        
        const response = await axios.post('https://api.tavily.com/search', {
            api_key: TAVILY_API_KEY,
            query: query,
            search_depth: 'basic',
            max_results: 5,
            include_answer: true
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000 // 15 secondes
        });
        
        console.log(`✅ Recherche terminée (${response.data.results?.length || 0} résultats)`);
        return response.data;
    } catch (error) {
        console.error('❌ Erreur Tavily:', error.response?.data?.detail || error.message);
        return null;
    }
}

// Recherche spécifique pour le marché de l'emploi
async function searchJobMarket() {
    const queries = [
        'métiers qui recrutent en Côte d\'Ivoire 2025 2026',
        'salaires moyens Côte d\'Ivoire 2026 emploi',
        'secteurs porteurs Côte d\'Ivoire 2026'
    ];
    
    let allResults = [];
    
    for (const query of queries) {
        const result = await searchWeb(query);
        if (result && result.answer) {
            allResults.push(result.answer);
        }
        // Petit délai pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (allResults.length === 0) {
        return {
            success: false,
            message: 'Aucun résultat trouvé'
        };
    }
    
    return {
        success: true,
        results: allResults.join('\n\n')
    };
}

// Fallback avec Groq (si Tavily ne fonctionne pas)
async function generateJobDataWithGroq(groqInstance) {
    const prompt = `Génère une liste des 12 métiers les plus recherchés en Côte d'Ivoire en 2025-2026.

Pour chaque métier, donne :
- Metier (nom du métier)
- Secteur (IT, Santé, BTP, Finance, Éducation, Agro-industrie, Commerce, Transport, Énergie)
- Salaire minimum en FCFA
- Salaire maximum en FCFA
- Demande (Très recherché, Moyennement recherché, Métier d'avenir, Peu recherché)
- Source (le site ou organisme)

Réponds UNIQUEMENT avec un JSON valide.`;

    try {
        const completion = await groqInstance.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: "Tu es un expert du marché de l'emploi en Côte d'Ivoire. Tu donnes des données réalistes et actualisées." 
                },
                { 
                    role: "user", 
                    content: prompt 
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.3,
            max_tokens: 2500
        });
        
        const content = completion.choices[0].message.content;
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(content);
    } catch (error) {
        console.error('❌ Erreur génération fallback:', error);
        return null;
    }
}

function needsWebSearch(query) {
    const keywords = [
        'salaire', 'recrute', 'combien gagne', 'métier', 'embauche',
        'travail', 'opportunité', 'recherche', 'débouché', 'employabilité',
        'secteur qui recrute', 'comment devenir', 'études pour',
        'quel métier', 'quel salaire', 'en côte d\'ivoire', 'en CI',
        'actuellement', 'aujourd\'hui', '2025', '2026', 'dernières',
        'actualité', 'nouveau', 'tendance',
        // ⬇️ AJOUTE CES MOTS-CLÉS ⬇️
        'donne-moi', 'liste des métiers', 'quels sont les métiers',
        'site web', 'liens', 'informations sur les métiers',
        'trouver des informations', 'ou trouver', 'comment trouver'
    ];
    
    const lowerQuery = query.toLowerCase();
    return keywords.some(keyword => lowerQuery.includes(keyword));
}

module.exports = { 
    searchWeb, 
    searchJobMarket,
    generateJobDataWithGroq,
    needsWebSearch
};