const API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?id='

/**
 * Our monster card DTO
 * Holds monster card properties
 */
class MonsterCard {
    constructor(name, atk, def, attribute, type, level, imageUrl) {
        this.name = name;
        this.atk = atk;
        this.def = def;
        this.attribute = attribute;
        this.type = type;
        this.level = level;
        this.imageUrl = imageUrl;
    }

    // Properties needed to check for bridging
    bridgingProperties = ['atk', 'def', 'attribute', 'type', 'level'];

    /**
     * Checks if this card bridges with other
     * Two cards bridge when exactly one of their properties match (excluding their name)
     */
    bridges(other) {
        let bridges = false;
        for (let property of this.bridgingProperties) {
            if (this[property] === other[property]) {
                if (bridges) {
                    return false;
                }
                bridges = true;
            }
        }
        return bridges;
    }
}

function onError(message) {
    // Display errors in html
    errorDiv = document.getElementById('error');
    if (errorDiv.innerText.size === 0) {
        errorDiv.innerText = message;
        errorDiv.style.display = 'block';
    } else {
        errorDiv.innerText = `${errorDiv.innerText}, ${message}`;
    }
}

function validateFile(file) {
    // Only allow *.ydk file names (TODO: should also validate content at some point)
    if (!file.name.endsWith('.ydk')) {
        this.onError('Please upload a ydk file.')
        return false;
    }

    return true;
}

async function readDeckFile(file) {
    // Read uploaded file as plain text
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        
        reader.onload = readerEvent => {
            resolve(readerEvent.target.result);
        }
        reader.onerror = reject;

        reader.readAsText(file);
    });
}

async function buildDeckSet(file) {
    let fileContent;
    try {
        fileContent = await this.readDeckFile(file);
    } catch (error) {
        this.onError(error);
        return;
    }

    let lines = fileContent.split('\n')
    // We need to remove the 1st two elements from the ydk file
    lines.shift();
    lines.shift();
    let keep = true;
    // We also need to remove all non main deck cards
    lines = lines.filter(function(element) {
        if (element === '#extra') {
            keep = false;
        }
        return keep;
    });
    
    // Return a set, so we filter duplicates
    return new Set(lines);
}

async function loadCards(file) {
    deck = await buildDeckSet(file);

    const monsterCards = {};
    for (const element of deck) {
        try {
            // Call our API to get card info by id
            const response = await fetch(API_URL + element);
            const responseJson = await response.json();
            const card = responseJson.data[0];
            console.log(card);
            
            // We only care about monster cards
            if (card.type.toLowerCase().includes('monster')) {
                monsterCards[card.name] = new MonsterCard(card.name, card.atk, card.def, card.attribute, card.race, card.level, card.card_images[0].image_url);
            }
        } catch (error) {
            onError(error);
        }
    }
    return monsterCards;
}

function calculate(monsterCards) {
    bridges = {}

    for (let reveal in monsterCards) {
        bridges[reveal] = new Set();
        for (let target in monsterCards) {
            // We need to get exactly one match
            if (monsterCards[reveal].bridges(monsterCards[target])) {
                //console.log(`Card ${reveal} bridges with ${target}.`);
                bridges[reveal].add(target);
            }
        }
    }

    return bridges;
}

function draw(bridges, cards) {
    let content = '';
    for (let reveal1 in bridges) {
        content += `<a href=${cards[reveal1].imageUrl}>${reveal1}</a><ul>`;
        for (let reveal2 of bridges[reveal1]) {
            content += `<li><a href=${cards[reveal2].imageUrl}>${reveal2}</a><ul>`;
            for (let target of bridges[reveal2]) {
                content += `<li><a href=${cards[target].imageUrl}>${target}</a></li>`
                //document.getElementById('world').innerHTML += `Reveal from hand: ${reveal1} -> Reveal from deck: ${reveal2} -> Add: ${target}<br>`
            }
            content += `</ul></li>`;
        }
        content += `</ul>`;
    }

    document.getElementById('world').innerHTML = content;
}

function main() {
    let deckUpload = document.getElementById('deck');

    deckUpload.onchange = e => {
        let file = e.target.files[0];
        if (!validateFile(file)) {
            return;
        }

        loadCards(file).then(function(cards) {
            bridges = calculate(cards);

            draw(bridges, cards);
        }).catch(function(error) {
            onError(error);
        });
    }
}

window.onload = main;