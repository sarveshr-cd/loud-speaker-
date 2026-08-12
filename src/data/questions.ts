// src/data/questions.ts
export interface Question {
  id: number;
  title: string;
  text: string;
}

export const questions: Question[] = [
  { id: 1, title: "The Morning Mystery", text: "Why do humans wake up every morning, immediately look at a glowing rectangle, and then complain that they are tired?" },
  { id: 2, title: "The Brown Liquid", text: "Why do humans voluntarily drink something that tastes terrible and then claim they cannot survive without it? Explain coffee." },
  { id: 3, title: "The Glowing Rectangle", text: "An alien sees humans staring at small glowing rectangles for hours. What is this magical rectangle, and why do humans spend more time looking at it than looking at each other? Do not use: phone, internet, social media." },
  { id: 4, title: "The Daily Water Ritual", text: "Why does a human deliberately make itself wet every morning? Explain taking a shower." },
  { id: 5, title: "The Eight-Hour Shutdown", text: "Why do humans spend approximately one-third of their lives lying unconscious on a soft surface? Explain sleeping." },
  { id: 6, title: "Fire on Food", text: "Why are humans setting their food on fire and celebrating? Explain birthdays." },
  { id: 7, title: "The Running Machine", text: "Why do humans pay money to run on machines that take them absolutely nowhere? Explain going to the gym." },
  { id: 8, title: "The Three-Eyed Guardian", text: "Why are all these machines obeying this three-eyed object? Explain traffic lights. Do not use: red, green, yellow, traffic." },
  { id: 9, title: "The Unemployed Roommate", text: "Why are humans supporting an unemployed roommate that eats their food and contributes nothing financially? Explain having a pet." },
  { id: 10, title: "The 47 Photos", text: "Why do humans take 47 photographs before choosing one? Explain selfies." },
  { id: 11, title: "The Invisible Power", text: "Why can't humans simply exchange chickens, bananas, and potatoes? Explain money." },
  { id: 12, title: "The Package Mystery", text: "Why do humans sit at home, touch a glowing rectangle, press a few buttons, and then wait for another human to bring them something they could have gone outside to get? Explain online shopping." },
  { id: 13, title: "The Parking Lot Migration", text: "Why are humans driving around a giant empty space for 15 minutes searching for one specific empty rectangle? Explain finding a parking space." },
  { id: 14, title: "The Fake People", text: "Why are humans paying money to sit in darkness and watch strangers pretend to have problems? Explain movies." },
  { id: 15, title: "Information Nobody Asked For", text: "Why do humans spend so much time discussing what other humans are doing when it has absolutely nothing to do with them? Explain gossip." },
  { id: 16, title: "The Bathroom Agreement", text: "Why would two humans voluntarily agree to live together, share food, share money, share a bathroom, and argue about what to watch? Explain marriage." },
  { id: 17, title: "The Meeting About the Meeting", text: "Why do humans spend one hour discussing something that could have been said in an email, only to schedule another meeting? Explain a work meeting." },
  { id: 18, title: "The Great Metal Migration", text: "If everyone wants to go forward, why are thousands of humans sitting inside metal boxes and standing still? Explain a traffic jam." },
  { id: 19, title: "Invisible Magic", text: "Explain Wi-Fi. You CANNOT use: internet, network, router, signal, wireless, computer." },
  { id: 20, title: "Defend Humanity", text: "You are the first human ambassador to an alien planet. The aliens say humans spend half their lives working, complain about work, spend money on things they don't need, stare at glowing rectangles, sit in traffic, and wake up early just to repeat the cycle. Convince the aliens that humans are worth keeping." }
];
