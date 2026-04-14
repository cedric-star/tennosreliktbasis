<script setup>
import { ref } from "vue";

import dropsF from '../data/drops.json'
import nodesF from '../data/solnodes.json'
import fissuresF from '../data/fissures.json'


const voidFissures = ref([]);
const nodes = ref({});
const drops = ref({});
const isLoading = ref(false);
const toShow = ref([]);

async function setMyVar(myVar, subURL) {
  try {
    const response = await fetch(subURL);
    console.log(`${subURL}:`, response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    myVar.value = data;
    return data;
  } catch (error) {
    console.error(`Fehler beim Laden von ${subURL}:`, error);
    myVar.value = null;
    return null;
  }
}

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


  // Korrekte Iteration durch die Mission Rewards
  if (drops.value && drops.value.missionRewards) {
    console.log("=== Mission Rewards durchgehen ===");

    for (const planet in drops.value.missionRewards) {
      //console.log(`Planet: ${planet}`);
      const missions = drops.value.missionRewards[planet];

      for (const missionName in missions) {
        const missionData = missions[missionName];
        const rewards = missionData.rewards;
        //console.log(` Mission: ${missionName}`);

        // rewards ist ein Objekt mit den Rotationen A, B, C
        for (const rotation in rewards) {
          //console.log(`   Rotation: ${rotation}`);

          // rewards[rotation] ist ein ARRAY von Reward-Objekten
          const rewardArray = rewards[rotation];

          // Durch das Array der Rewards iterieren
          for (let i = 0; i < rewardArray.length; i++) {
            const reward = rewardArray[i];
            //console.log(`     Reward ${i}: ${reward.itemName}`);

            // Nach Relics suchen
            if (reward.itemName && reward.itemName.includes("Relic")) {
              console.log(`Found Relic: [${planet} | ${missionName}]`);
              console.log(`  Rotation: ${rotation}`);
              console.log(`  Relic: ${reward.itemName}`);

            }
          }
        }
      }
    }
  } else {
    console.warn("Keine Mission Rewards Daten gefunden");
  }

  console.log("nodes:" + nodes.value);
  console.log("drops:" + drops.value);
  isLoading.value = false;
}
</script>

<template>
  <button @click="getRelicDropsForNode()" :disabled="isLoading">
    {{ isLoading ? 'Lade Daten...' : 'Berechne Relikte' }}
  </button>

  <table>
    <thead>
    <tr>
      <th>Void Fissure Node</th>
      <th>Relic to Open</th>
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
template {
  background: #452b03;
}
</style>