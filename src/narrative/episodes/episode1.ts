import type { Episode } from "@/types";

export const EPISODE_1: Episode = {
  id: "ep1",
  title: "Episode 1: Twilight at Pinecrest Hollow",
  summary: "Arrival at Summer Camp. Orientation campfire and morning activity selection.",
  startSceneId: "scene_campfire",
  scenes: {
    scene_campfire: {
      id: "scene_campfire",
      title: "Campfire Gathering",
      defaultBackground: "campfire_night",
      startNodeId: "node_1",
      nodes: {
        node_1: {
          id: "node_1",
          speakerId: "maya",
          text: "Welcome to Summer Camp! The sun has set behind the pines, and tonight's campfire orientation is about to begin.",
          nextNodeId: "node_2",
          actions: {
            modifyStats: { stamina: 100 },
          },
        },
        node_2: {
          id: "node_2",
          speakerId: "maya",
          text: "Before we hand out tent keys, each camper needs to choose their starting activity for tomorrow morning.",
          choices: [
            {
              id: "choice_hike",
              text: "🌲 Join the Dawn Ridge Hike & Nature Trail",
              targetNodeId: "node_hike",
              onSelectAction: {
                setFlags: { chose_hike: true },
                modifyStats: { stamina: -10 },
              },
            },
            {
              id: "choice_kayak",
              text: "🛶 Early Morning Kayaking at Emerald Lake",
              targetNodeId: "node_kayak",
              onSelectAction: {
                setFlags: { chose_kayak: true },
                modifyStats: { stamina: -15 },
              },
            },
            {
              id: "choice_craft",
              text: "🪵 Woodcarving & Outdoor Survival Workshop",
              targetNodeId: "node_craft",
              onSelectAction: {
                setFlags: { chose_craft: true },
                modifyStats: { stamina: -5 },
              },
            },
          ],
        },
        node_hike: {
          id: "node_hike",
          speakerId: "ben",
          text: "A hiking enthusiast! Pack your boots early. The sunrise above the valley ridge is something you won't forget.",
          nextNodeId: "node_conclusion",
        },
        node_kayak: {
          id: "node_kayak",
          speakerId: "ben",
          text: "The waters of Emerald Lake are crisp at dawn. Keep your life jacket strapped on tight!",
          nextNodeId: "node_conclusion",
        },
        node_craft: {
          id: "node_craft",
          speakerId: "ben",
          text: "A sharp mind and steady hands. Survival skills might come in handy sooner than you think.",
          nextNodeId: "node_conclusion",
        },
        node_conclusion: {
          id: "node_conclusion",
          speakerId: "ben",
          text: "Remember campers: stay on marked trails, watch the campfire embers, and don't wander into the Whispering Hollows after dark.",
        },
      },
    },
  },
};
