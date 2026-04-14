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
              if (reward.itemName && (reward.itemName.includes("Relic") || reward.itemName.includes("Requiem"))) {
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
    type: item.missionType,
    tier: item.tier,
    //relicNames: item.rewards.map(r => `${r.relic} (${r.rotation})`).join(', '),
    relicsByRotation: {
      A: item.rewards.filter(r => r.rotation === "A").map(r => r.relic.replace(' Relic', ``)+" ("+r.rarity+")").sort(),
      B: item.rewards.filter(r => r.rotation === "B").map(r => r.relic.replace(' Relic', '')+" ("+r.rarity+")").sort(),
      C: item.rewards.filter(r => r.rotation === "C").map(r => r.relic.replace(' Relic', '')+" ("+r.rarity+")").sort(),
    },
    relicsByRole: {
      Lith: item.rewards.filter(r => r.relic.includes("Lith")).map(r => r.relic.replace(' Relic', '')).sort(),
      Meso: item.rewards.filter(r => r.relic.includes("Meso")).map(r => r.relic.replace(' Relic', '')).sort(),
      Neo: item.rewards.filter(r => r.relic.includes("Neo")).map(r => r.relic.replace(' Relic', '')).sort(),
      Axi: item.rewards.filter(r => r.relic.includes("Axi")).map(r => r.relic.replace(' Relic', '')).sort(),
      Requiem: item.rewards.filter(r => r.relic.includes("Requiem")).map(r => r.relic.replace(' Relic', '')).sort()
    },
    relicTypes: [...new Set(item.rewards.map(r => {
      if (r.relic.includes("Lith")) return "Lith";
      if (r.relic.includes("Meso")) return "Meso";
      if (r.relic.includes("Neo")) return "Neo";
      if (r.relic.includes("Axi")) return "Axi";
      if (r.relic.includes("Requiem")) return "Requiem";
      return null;
    }).filter(Boolean))].sort()
  }));

  // toShow mit den Node-Namen füllen (optional)
  const toShow = resultData.map(item => item.nodeName);
  console.log("Missionen mit Relics:", toShow);

  isLoading.value = false;
}
</script>
<template>
  <div class="container">
    <div class="header">
      <button @click="getRelicDropsForNode()" :disabled="isLoading" class="calculate-btn">
        {{ isLoading ? 'Lade Daten...' : 'Berechne Relikte' }}
      </button>
    </div>

    <!-- Debug: Zeige das JSON -->
    <details v-if="fissureData.length > 0" class="debug">
      <summary>📊 JSON Struktur anzeigen ({{ fissureData.length }} Missionen)</summary>
      <pre>{{ JSON.stringify(fissureData, null, 2)}}</pre>
    </details>

    <div class="table-wrapper" v-if="fissureData.length > 0">
      <table>
        <thead>
        <tr>
          <th>Void Fissure Node</th>
          <th>Mission Type</th>
          <th class="rotation-header A">Rotation A</th>
          <th class="rotation-header B">Rotation B</th>
          <th class="rotation-header C">Rotation C</th>
          <th>Relic Types</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(mission, index) in fissureData" :key="index" class="mission-row">
          <td class="node-cell">
            <div class="node-name">{{ mission.node }}</div>
          </td>
          <td class="type-cell">
            <span class="mission-type">{{ mission.type }}</span>
          </td>
          <td class="relic-cell rotation-A">
            <ul class="relic-list">
              <li v-for="relic in mission.relicsByRotation.A" :key="relic" class="relic-item">
                {{ relic }}
              </li>
              <li v-if="!mission.relicsByRotation.A.length" class="no-relic">—</li>
            </ul>
          </td>
          <td class="relic-cell rotation-B">
            <ul class="relic-list">
              <li v-for="relic in mission.relicsByRotation.B" :key="relic" class="relic-item">
                {{ relic }}
              </li>
              <li v-if="!mission.relicsByRotation.B.length" class="no-relic">—</li>
            </ul>
          </td>
          <td class="relic-cell rotation-C">
            <ul class="relic-list">
              <li v-for="relic in mission.relicsByRotation.C" :key="relic" class="relic-item">
                {{ relic }}
              </li>
              <li v-if="!mission.relicsByRotation.C.length" class="no-relic">—</li>
            </ul>
          </td>
          <td class="types-cell">
            <div class="relic-types">
                <span v-for="(type, idx) in mission.relicTypes" :key="type" class="relic-type-badge" :class="type.toLowerCase()">
                  {{ type }}
                </span>
              <span v-if="!mission.relicTypes.length" class="no-types">—</span>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="!isLoading && fissureData.length === 0" class="empty-state">
      <p>Keine Daten verfügbar. Klicke auf "Berechne Relikte".</p>
    </div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  background: #452b03;
  min-height: 100vh;
}

.header {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.calculate-btn {
  background: #ffd700;
  color: #452b03;
  border: none;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.calculate-btn:hover:not(:disabled) {
  background: #ffed4a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.calculate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.debug {
  background: #2a1a02;
  border: 1px solid #ffd700;
  border-radius: 8px;
  margin-bottom: 24px;
  padding: 12px;
  cursor: pointer;
}

.debug summary {
  color: #ffd700;
  font-weight: bold;
  user-select: none;
}

.debug pre {
  color: #ffd700;
  font-size: 11px;
  overflow-x: auto;
  margin-top: 12px;
  padding: 8px;
  background: #1a0f01;
  border-radius: 4px;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  background: #2a1a02;
  padding: 1px;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  color: #ffd700;
  background: #2a1a02;
  border-radius: 12px;
  overflow: hidden;
}

th {
  background: #1a0f01;
  padding: 14px 12px;
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #ffd700;
}

th.rotation-header {
  text-align: center;
  font-size: 16px;
}

th.A { background: linear-gradient(135deg, #1a0f01 0%, #2a1a02 100%); }
th.B { background: linear-gradient(135deg, #1a0f01 0%, #2a1a02 100%); }
th.C { background: linear-gradient(135deg, #1a0f01 0%, #2a1a02 100%); }

td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
  vertical-align: top;
}

.mission-row:hover {
  background: rgba(255, 215, 0, 0.05);
}

.node-cell {
  font-weight: bold;
  width: 22%;
}

.node-name {
  font-size: 14px;
}

.type-cell {
  width: 15%;
}

.mission-type {
  display: inline-block;
  background: rgba(255, 215, 0, 0.15);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.relic-cell {
  width: 18%;
  background: rgba(0, 0, 0, 0.2);
}

.rotation-A { border-left: 3px solid #ffd700; }
.rotation-B { border-left: 3px solid #ffd700; }
.rotation-C { border-left: 3px solid #ffd700; }

.relic-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.relic-item {
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px dashed rgba(255, 215, 0, 0.15);
  font-family: 'Courier New', monospace;
}

.relic-item:last-child {
  border-bottom: none;
}

.no-relic {
  color: rgba(255, 215, 0, 0.4);
  font-style: italic;
  text-align: center;
  padding: 8px 0;
  display: block;
}

.types-cell {
  width: 12%;
  background: rgba(0, 0, 0, 0.2);
}

.relic-types {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.relic-type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.3);
  transition: all 0.2s ease;
}

.relic-type-badge:hover {
  transform: scale(1.05);
  background: rgba(255, 215, 0, 0.25);
  border-color: #ffd700;
}

.relic-type-badge.lith { border-left: 3px solid #ffd700; }
.relic-type-badge.meso { border-left: 3px solid #ffaa00; }
.relic-type-badge.neo { border-left: 3px solid #ff8800; }
.relic-type-badge.axi { border-left: 3px solid #ff6600; }
.relic-type-badge.requiem { border-left: 3px solid #ff4444; }

.no-types {
  color: rgba(255, 215, 0, 0.4);
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #2a1a02;
  border-radius: 12px;
  color: #ffd700;
  opacity: 0.7;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* Scrollbar Styling */
.table-wrapper::-webkit-scrollbar {
  height: 8px;
}

.table-wrapper::-webkit-scrollbar-track {
  background: #1a0f01;
  border-radius: 4px;
}

.table-wrapper::-webkit-scrollbar-thumb {
  background: #ffd700;
  border-radius: 4px;
}

/* Responsive */
@media (max-width: 1024px) {
  .container {
    padding: 12px;
  }

  th, td {
    padding: 8px 6px;
  }

  .node-name, .relic-item {
    font-size: 11px;
  }

  .mission-type {
    font-size: 10px;
  }

  .relic-type-badge {
    font-size: 9px;
    padding: 3px 8px;
  }
}

@media (max-width: 768px) {
  .table-wrapper {
    font-size: 10px;
  }

  .relic-types {
    gap: 4px;
  }

  .relic-type-badge {
    font-size: 8px;
    padding: 2px 6px;
  }
}
</style>