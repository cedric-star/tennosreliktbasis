<script setup>
import { ref } from "vue";

import dropsF from '../data/drops.json'
import nodesF from '../data/solnodes.json'
import fissuresF from '../data/fissures.json'

const voidFissures = ref([]);
const nodes = ref({});
const drops = ref({});
const isLoading = ref(false);
const fissureData = ref([]); // Für die Tabelle

async function getFissures() {
  //return setMyVar(voidFissures, "https://api.warframestat.us/pc/fissures");
  return voidFissures.value = fissuresF;
}

async function getNodes() {
  //return setMyVar(nodes, "https://api.warframestat.us/pc/solNodes");
  return nodes.value = nodesF;
}

async function getMissionDrops() {
  //return setMyVar(drops, "https://drops.warframestat.us/data/missionRewards.json");
  return drops.value = dropsF;
}

async function getRelicDropsForNode() {
  isLoading.value = true;
  console.log("Starte API-Aufrufe...");

  await Promise.all([
    getNodes(),
    getFissures(),
    getMissionDrops()
  ]);

  const fissureNodes = new Map(); // Map statt Set für mehr Infos
  if (voidFissures.value && Array.isArray(voidFissures.value)) {
    voidFissures.value.forEach(fissure => {
      const nodeName = fissure.node.split(' (')[0];
      const planetName = fissure.node.match(/\(([^)]+)\)/)?.[1] || "Unknown";

      fissureNodes.set(nodeName, {
        node: fissure.node,
        tier: fissure.tier,
        planet: planetName,
        missionType: fissure.missionType
      });

      console.log(`Fissure Node: ${fissure.node} -> ${nodeName} (${planetName})`);
    });
  }

  // Das gewünschte JSON Array aufbauen
  const resultData = [];

  if (drops.value && drops.value.missionRewards) {
    console.log("=== Mission Rewards durchgehen ===");

    for (const planet in drops.value.missionRewards) {
      const missions = drops.value.missionRewards[planet];

      for (const missionName in missions) {
        // Prüfen ob diese Mission in den Fissures vorkommt
        if (fissureNodes.has(missionName)) {
          const fissureInfo = fissureNodes.get(missionName);
          const missionData = missions[missionName];
          const rewards = missionData.rewards;

          // Array für alle Relics dieser Mission
          const relicRewards = [];

          // Durch alle Rotationen (A, B, C) gehen
          for (const rotation in rewards) {
            const rewardArray = rewards[rotation];

            // Durch alle Rewards iterieren
            for (let i = 0; i < rewardArray.length; i++) {
              const reward = rewardArray[i];

              // Nach Relics suchen
              if (reward.itemName && reward.itemName.includes("Relic")) {
                relicRewards.push({
                  relic: reward.itemName,
                  rotation: rotation,
                  rarity: reward.rarity || "Unknown"
                });

                console.log(`Found Relic: [${planet} | ${missionName}]`);
                console.log(`  Rotation: ${rotation}`);
                console.log(`  Relic: ${reward.itemName}`);
                console.log(`  Rarity: ${reward.rarity || "Unknown"}`);
              }
            }
          }

          // Nur hinzufügen wenn Relics gefunden wurden
          if (relicRewards.length > 0) {
            resultData.push({
              node: fissureInfo.node,
              nodeName: missionName,
              planet: fissureInfo.planet,
              tier: fissureInfo.tier,
              missionType: fissureInfo.missionType,
              rewards: relicRewards
            });
          }
        }
      }
    }
  } else {
    console.warn("Keine Mission Rewards Daten gefunden");
  }

  // Ausgabe des fertigen JSON
  console.log("=== RESULT JSON ===");
  console.log(JSON.stringify(resultData, null, 2));




  // Für die Tabelle aufbereiten
  fissureData.value = resultData.map(item => ({
    node: item.node,
    tier: item.tier,
    relicNames: item.rewards.map(r => `${r.relic} (${r.rotation})`).join(', '),
    relicsByRotation: {
      A: item.rewards.filter(r => r.rotation === "A").map(r => r.relic.replace(' Relic', '')),
      B: item.rewards.filter(r => r.rotation === "B").map(r => r.relic.replace(' Relic', '')),
      C: item.rewards.filter(r => r.rotation === "C").map(r => r.relic.replace(' Relic', ''))
    }
  }));

  // toShow mit den Node-Namen füllen (optional)
  const toShow = resultData.map(item => item.nodeName);
  console.log("Missionen mit Relics:", toShow);

  isLoading.value = false;
}
</script>

<template>
  <button @click="getRelicDropsForNode()" :disabled="isLoading">
    {{ isLoading ? 'Lade Daten...' : 'Berechne Relikte' }}
  </button>

  <!-- Debug: Zeige das JSON -->
  <details v-if="fissureData.length > 0" class="debug">
    <summary>JSON Struktur anzeigen ({{ fissureData.length }} Missionen)</summary>
    <pre>{{ JSON.stringify(fissureData, null, 2)}}</pre>
  </details>

  <table>
    <thead>
    <tr>
      <th>Void Fissure Node</th>
      <th>Tier</th>
      <th>Relics dropping</th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="(mission, index) in fissureData" :key="index">
      <td>{{ mission.node }}</td>
      <td>{{ mission.tier }}</td>
      <td>{{ mission.relicNames || 'Keine Daten' }}</td>
    </tr>
    </tbody>
  </table>
</template>

<style scoped>
.debug {
  margin: 20px;
  padding: 10px;
  background: #1a0f01;
  border: 1px solid #ffd700;
  border-radius: 5px;
}

.debug pre {
  color: #ffd700;
  font-size: 12px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  color: #ffd700;
}

th, td {
  border: 1px solid #ffd700;
  padding: 8px;
  text-align: left;
}

button {
  margin: 20px;
  padding: 10px 20px;
  background: #ffd700;
  color: #452b03;
  border: none;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
}
</style>