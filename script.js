// Remplacez la partie qui génère fullSummaryHtml par ceci :
const res = await summarizer(blocks[i], { max_new_tokens: 150 });
let cleanSummary = res[0].summary_text;

// Transformation automatique en liste à puces si l'IA détecte des énumérations
let formattedPoint = cleanSummary.replace(/[:;]/g, ':').split(':');

fullSummaryHtml += `
    <div class="summary-chapter">
        <h3>Titre : ${file.name.split('.')[0]} - Partie ${i+1}</h3>
        <p>${formattedPoint[0]}</p>
        <ul>
            ${formattedPoint.length > 1 ? `<li>${formattedPoint.slice(1).join('</li><li>')}</li>` : `<li>Analyse approfondie des concepts clés</li>`}
        </ul>
    </div>
`;
