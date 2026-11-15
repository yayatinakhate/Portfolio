/* =====================================================================
   PORTFOLIO CONTENT
   ---------------------------------------------------------------------
   Everything the site shows lives in this one file. To add a photo,
   a video or a whole chapter, edit here; no layout code needs to change.

   Quick reference
   ---------------
   theme      : "blue" | "ink" | "orange" | "butter" | "cream"
   chip       : "tried" | "failed" | "worked" | "cost"
   ar         : aspect ratio for a photo, e.g. "4/5", "1/1", "16/9"
   block types: text, intro, strip, note, mosaic, probs, columns,
                scrubber, projects, process, duo, dl, log, bigquote,
                flips, tags, bench, video, stats, placeholder
   See README.md for a worked example of each block.
   ===================================================================== */
window.PORTFOLIO = {

  person: {
    name: "Yayati Nakhate",
    tagline: "Built. Broken. Rebuilt.",
    sub: "a journey through things that didn't work (yet)",
    meta: ["Portfolio 2026", "Applying for MS Mechanical Engineering"],
    email: "nakhateyayati@gmail.com",
    linkedin: "https://www.linkedin.com/in/yayati-nakhate-90814a208",
    resume: "docs/Yayati-Nakhate-Resume.pdf",                 /* drop the PDF in docs/ with this name, or change the path */
    description: "Portfolio of Yayati Nakhate, mechanical design engineer: aero teams, 3D printers, drones and jet UAVs, failures included."
  },

  /* What an admissions reader looks for first. Shown in the intro, the flight plan and the academic record. */
  applicant: {
    degree: "B.E. Mechanical Engineering, Honours in Robotics",
    school: "Fr. Conceicao Rodrigues College of Engineering, University of Mumbai · 2020–2024",
    cgpa: "8.22",
    cgpaOf: "/ 10 CGPA",
    interests: ["Composite & structural mechanics", "Structural optimization", "UAV & aircraft design"],
    coursework: ["Fluid Mechanics", "Strength of Materials", "Machine Design", "Finite Element Analysis", "Control Systems", "Robotics"],
    certifications: ["Aerial Robotics, University of Pennsylvania (Coursera)", "Flight Mechanics (Coursera)", "Advanced 3D Printing (Coursera)"],
    leadership: ["Technical Head, IIIExCRCE", "Operations Head, ASME Student Chapter, CRCE"]
  },

  /* The hero photo and where the goggles lens sits in it (0..1 of width/height).
     depth: optional greyscale depth map (white = near). If missing, a procedural
     one is generated for a seated figure in the centre of the frame. */
  hero: {
    image: "img/goggles.jpg",
    depth: null,
    lens: [0.565, 0.385],
    toon: { levels: 6, edge: 1.0, saturation: 1.25, strength: 1.0 },   /* cel-shading: colour bands, ink edges, saturation; strength 0 = plain photo */
    figure: [0.53, 0.60, 0.30, 0.78],   /* ellipse centre x,y and radii x,y used by the procedural depth map and the slim warp */
    slim: 0.22,                         /* how much narrower the figure looks: 0.22 = 22% (0 = as photographed, max 0.25) */
    cue: "Scroll to put the goggles on"
  },

  /* On-screen display shown once you are "inside" the goggles. */
  hud: {
    callsign: "YAYATI",
    link: "VTX 5.8G · CH R4",
    voltageStart: 16.8,
    voltageEnd: 14.3,
    flightSeconds: 54 * 60 + 33,       /* the timer runs from 00:00 to this over the whole journey */
    /* footage behind the HUD while flying to each chapter: chapter n plays clip n, wrapping round.
       Keep clips 4-8 s, 720p, H.264, no audio, ~3 MB; put a .jpg of the first frame next to each (same name). */
    transitVideos: [                  /* position n flies into chapter n (00, 01, 02, Sundays, 03, 04, 05, 06, 07), then wraps */
      "media/transit/hills-1.mp4",      /* 00  sunrise over misty valleys (GoPro) */
      "media/transit/fields-1.mp4",     /* 01  low over the Surat fields */
      "media/transit/hills-2.mp4",      /* 02  ridge under big clouds (GoPro) */
      "media/transit/fields-2.mp4",     /* Sundays  banked dive, then skimming the crop tops */
      "media/transit/hills-3.mp4",      /* 03 InsideFPV  dive along a ridge (GoPro) */
      "media/transit/fields-flip.mp4",  /* 04 Garuda3D  rows, then a full roll past the apartment blocks */
      "media/transit/hills-clouds.mp4", /* 05  big cumulus over a deep green valley (GoPro) */
      "media/transit/hills-roll.mp4"    /* 06 Invente  banked roll over the hills (GoPro) */
    ],
    enterText: ["GOGGLES ON", "LINK OK", "ARMED"],
    exitText: ["LOW BATTERY", "RTH", "LANDED", "DISARMED"]
  },

  /* ------------------------------------------------------------------
     CHAPTERS, in order. Each one flies in as a waypoint.
     ------------------------------------------------------------------ */
  chapters: [

    /* ---------------- 00 CHILDHOOD ---------------- */
    {
      id: "childhood",
      num: "00",
      title: "Before the workshop",
      role: "Where it started",
      theme: "ink",
      cover: null,                      /* add { src: "img/kid-1.jpg", alt: "..." } when you have one */
      story: [
        "If it moves, I take it apart in my head. A bike, a car, an aircraft: I rebuild it the way I would in SolidWorks. Which part goes down first, what mates to it next, why the designer chose this shape and not another."
      ],
      quote: "An old habit. It started long before the workshop.",
      blocks: [
        /* childhood photos go here when you have them, e.g.
           { type: "strip", theme: "ink", cols: 3, title: "...", items: [ { src: "img/kid-1.jpg", ar: "4/5", caption: "..." } ] }, */

        { type: "intro", theme: "butter",
          image: { src: "img/me.png", alt: "Yayati working on a drone, illustrated in blue" },
          title: "I'm Yayati.",
          lede: "A mechanical design engineer who learns by building things, breaking them, and working out why. One college aero team and five companies later, most of what I know came from the parts that didn't work.",
          facts: [
            { k: "Education", v: "B.E. Mechanical Engineering, Honours in Robotics<br>University of Mumbai, 2024 · CGPA 8.22 / 10" },
            { k: "Tools", v: "Siemens NX, SolidWorks, Fusion 360<br>ANSYS, XFLR5, Altair OptiStruct<br>Composites, additive manufacturing" }
          ],
          interests: true,                /* shows applicant.interests as chips */
          script: "This is the story so far, mistakes included." },

        { type: "numbers", theme: "ink",
          title: "The short version",
          items: [
            { n: 121,  unit: "min",  label: "world-record drone flight time, through structural weight optimization" },
            { n: 400,  unit: "km/h", label: "design speed of the jet UAV's composite airframe" },
            { n: 5400, unit: "m",    label: "altitude of the flight trials in Ladakh" },
            { n: 4,    unit: "platforms", label: "3D printers designed: FDM, pellet, food and bio" },
            { text: "2 + 2", label: "utility patents and design registrations" },
            { text: "Top 10", label: "SAE Aero Design USA, as Design & Modelling Head" }
          ] }
      ]
    },

    /* ---------------- 01 COLLEGE + TEAM VAAYUSHASTRA ---------------- */
    {
      id: "college",
      num: "01",
      title: "Team Vaayushastra",
      role: "SAE Aero Design, Design and Modelling Head",
      theme: "blue",
      learned: "learned: where I learned to make things",
      methods: ["Aircraft design trade-offs", "CAD modelling", "Composite fabrication"],
      result: "A top-10 finish at SAE Aero Design USA, and my first carbon-fibre part out of the mould in one piece.",
      cover: { src: "img/vs-cover.jpg", alt: "Team members holding a carbon-fibre mould over a plug" },
      story: [
        "Vaayushastra gave me a lot of firsts. I learned to design starting with chairs and bearings, made my first carbon-fibre part by vacuum bagging, and sanded enough balsa and aluminium for a lifetime."
      ],
      quote: "“I left a part of me in aerospace here.”",
      blocks: [
        { type: "strip", theme: "cream", cols: 4, kicker: "What mates to it next",
          title: "How did I get there?",
          intro: "Second year: on the aircraft 14 hours a day, every day.",
          items: [
            { src: "img/vs-1.jpg", chip: "tried",  caption: "Shaping plugs by hand, for hours" },
            { src: "img/vs-2.jpg", chip: "tried",  caption: "First carbon-fibre part, vacuum bagged" },
            { src: "img/vs-3.jpg", chip: "worked", caption: "It came out of the mould in one piece" },
            { src: "img/vs-4.jpg", chip: "worked", caption: "The aircraft" }
          ],
          note: { chip: "cost", text: "We skipped almost every second-year lecture to build it. Nearly the whole team ended up with a backlog (KT)." } },

        { type: "strip", theme: "cream", cols: 3, plain: true,
          title: "Selected college works",
          items: [
            { src: "img/col-1.jpg", ar: "3/2", heading: "Bionic arm", caption: "Multifunctional arm with sensors, lightweight materials and inverse kinematics, for lifting, writing and more. Servo-driven, battery-powered, modular." },
            { src: "img/col-2.jpg", ar: "3/2", heading: "Wheel assembly and suspension", caption: "Optimised design and material choice for stress, weight and alignment, using simulation tools. Formula racing team, vehicle dynamics." },
            { src: "img/col-3.jpg", ar: "3/2", heading: "Endangered species detection", caption: "Object detection with YOLO to track and monitor endangered species in their habitats." }
          ] },

        { type: "academics", theme: "ink",
          title: "On paper",
          projects: [
            { name: "Powered glider with vision-based autonomous landing", tools: "CFD · Python · OpenCV · Raspberry Pi 3",
              text: "A 450 g powered glider, its airframe refined through iterative CFD. An OpenCV pipeline finds the landing zone and lands it autonomously, with navigation and control on board." },
            { name: "Bionic arm with muscle-signal control", tools: "Arduino · Piezoelectric sensing · Servo actuation",
              text: "A 3-DOF arm driven by servos through mechanical linkages, controlled in real time from muscle signals and voice." }
          ] }
      ]
    },

    /* ---------------- 02 DIVIDE BY ZERO ---------------- */
    {
      id: "dbz",
      num: "02",
      title: "Divide by Zero Technologies",
      role: "Mechanical design intern",
      result: "Designed and developed the Aeqon 400V4 and Aion 500 MK2 3D printers.",
      theme: "ink",
      learned: "learned: how a machine is built",
      methods: ["Topology optimization", "Machine design", "Fixture design"],
      cover: { src: "img/dbz-1.jpg", alt: "Industrial FDM printer with blue lighting" },
      story: [
        "At an ASME conference I got talking to the CEO. That one conversation became an internship at the start of my fourth year: industrial FDM printers that print, CNC-machine and finish a part in the same machine."
      ],
      quote: "From here, my life became a rollercoaster.",
      blocks: [
        { type: "columns", theme: "ink", ratio: "1fr 1.2fr",
          left: [
            { type: "text", h2: "Printers that print, machine and finish",
              paras: ["Industrial FDM printers that print, CNC-machine and finish a part in the same machine."],
              script: "From here, my life became a rollercoaster." }
          ],
          right: [
            { type: "mosaic", items: [
              { src: "img/dbz-1.jpg", alt: "Industrial FDM printer with blue lighting", tall: true },
              { src: "img/dbz-2.jpg", alt: "Printed lattice in hand", ar: "1/1" },
              { src: "img/dbz-3.jpg", alt: "Clear machined and printed parts", ar: "1/1" }
            ] }
          ] }
      ]
    },

    /* ---------------- INTERLUDE: SUNDAYS ---------------- */
    {
      id: "sundays",
      num: "··",
      title: "Sundays",
      role: "Interlude",
      theme: "butter",
      interlude: true,
      learned: "learned: where I belong",
      result: "Saved for a controller, then built my own drone, a few parts a month.",
      cover: { src: "img/crew.jpg", alt: "The Sunday FPV crew, drones in hand, in front of a Thar" },
      video: { src: "media/flight.mp4", poster: "img/sun-1.jpg" },
      story: [
        "While I built printers, I escaped to fly. Every Sunday our FPV community met up. They taught me sitting beside me on the ground, watching my feed through their goggles, calming me when I panicked that I was too far to find my way back, and talking me in until I landed.",
        "I saved for two months for my first controller, practised on a simulator, and bought a few parts a month for six months until I had my own build."
      ],
      quote: "That's when I knew where I belong: drones, VTOLs, aircraft.",
      blocks: [
        { type: "video", theme: "butter",
          src: "media/flight.mp4", poster: "img/sun-1.jpg",
          label: "FPV FEED · SUNDAY",
          aside: [
            { src: "img/crew.jpg", ar: "4/3", caption: "The crew that talked me in", wide: true },
            { src: "img/sun-2.jpg", ar: "4/5", caption: "Field repairs on the ground" },
            { src: "img/sun-3.jpg", ar: "4/5", caption: "My own build, finally" }
          ] }
      ]
    },

    /* ---------------- 03 INSIDEFPV ---------------- */
    {
      id: "insidefpv",
      num: "03",
      title: "InsideFPV",
      role: "Mechanical design engineer, R&D: drones for consumer, agricultural and defence use",
      theme: "blue",
      learned: "learned: that I belong with things that fly",
      methods: ["Structural weight optimization", "Mass budgeting", "Mechanism design"],
      result: "Watchdog's 121-minute world-record flight, plus 2 utility patents and 2 design rights.",
      cover: { src: "img/ifpv-cover.jpg", alt: "A hexacopter drone standing in snow" },
      stats: [
        { n: 121, label: "min, world-record flight time, Watchdog" },
        { n: 172, label: "mph, interceptor design target" },
        { text: "2+2", label: "utility patents + design rights" }
      ],
      quote: "Finally building the things I fly.",
      blocks: [
        { type: "projects", theme: "cream",
          title: "What I worked on",
          intro: "Hover or tap a project to read more. Click to see the photo full size.",
          items: [
            { src: "img/ifpv-watchdog.jpg",    name: "Watchdog",    text: "World-record flight time of 121 min. Holds a design right." },
            { src: "img/ifpv-elevate.jpg",     name: "Elevate Z1",  text: "Surveillance drone for the Indian Army.", contain: true },
            { src: "img/ifpv-kamikaze.jpg",    name: "Kamikaze",    text: "Strike drone for the Indian Army, built for night missions." },
            { src: "img/ifpv-ai.jpg",          name: "AI drones",   text: "Fully autonomous, designed for level-4 autonomy and object tracking." },
            { src: "img/ifpv-interceptor.jpg", name: "Interceptor", text: "High-speed frame designed to reach 172 mph." },
            { src: "img/ifpv-controllers.jpg", name: "Controllers", text: "Radio and motion controllers for precise long-range command." }
          ] },

        { type: "process", theme: "ink", kicker: "Which part goes down first",
          title: "From drawing to field",
          script: "Repeated until it flew.",
          items: [
            { src: "img/proc-1.jpg", caption: "Sketch the layout" },
            { src: "img/proc-2.jpg", caption: "Model it" },
            { src: "img/proc-3.jpg", caption: "Make the parts" },
            { src: "img/proc-4.jpg", caption: "Wire it up" },
            { src: "img/proc-5.jpg", caption: "Assemble, on the floor if needed" },
            { src: "img/proc-6.jpg", caption: "Test in the field" }
          ] }
      ]
    },

    /* ---------------- 04 GARUDA3D ---------------- */
    {
      id: "garuda",
      num: "04",
      title: "Garuda3D",
      role: "3D printer engineer, R&D: pellet, chocolate, bio and FDM printers",
      theme: "orange",
      learned: "learned: how things fail",
      methods: ["Extruder & nozzle mechanisms", "Subsystem integration", "Calibration & material trials"],
      result: "Full-bed pellet prints, a chocolate vase that stands, and bio and FDM printers packed and shipped.",
      cover: { src: "img/g3d-cover.jpg", alt: "Yayati sitting inside a large printer frame" },
      story: [
        "After a year of drones, I went back to printers: four of them, and every one fought back. Pellets clogged, chocolate ran, beds wouldn't hold temperature. Almost nothing on the next pages worked the first time."
      ],
      quote: "Lots of Benchys lying around. None of them edible.",
      blocks: [
        { type: "columns", theme: "cream", ratio: "1.2fr 1fr", align: "start",
          h2: "Pellet printer: the nozzle that kept clogging",
          left: [
            { type: "strip", cols: 3, bare: true, items: [
              { src: "img/pel-1.jpg", ar: "1/1", chip: "failed", caption: "Strings everywhere" },
              { src: "img/pel-2.jpg", ar: "1/1", chip: "failed", caption: "Walls that gave up" },
              { src: "img/pel-3.jpg", ar: "1/1", chip: "failed", caption: "A bed's worth of plastic, wasted" }
            ] },
            { type: "probs", items: [
              "Pellets melted at the very top of the nozzle, so the lead screw couldn't push them down. It clogged.",
              "Three temperature zones in one pellet nozzle, each to tune.",
              "A large bed that had to run hot at some stages and cold at others, depending on the material, without vibrating.",
              "Finding the pellet size and shape that would actually feed."
            ] }
          ],
          right: [
            { type: "figure", src: "img/pel-4.jpg", ar: "1/1.08", chip: "worked", caption: "Where it landed: a full-bed print" }
          ] },

        { type: "columns", theme: "butter", ratio: "1.6fr 1fr", align: "start",
          h2: "Test, print, test again",
          left: [
            { type: "figure", src: "img/test-1.jpg", ar: "16/9", caption: "Test prints on the way to a finished part" }
          ],
          right: [
            { type: "mosaic", items: [
              { src: "img/test-2.jpg", ar: "5/2", wide: true, caption: "Dog-bone specimens, labelled by print setting" },
              { src: "img/test-3.jpg", ar: "1/1", caption: "A gear that meshed" },
              { src: "img/test-4.jpg", ar: "1/1", caption: "The bear, finally" }
            ] }
          ] },

        { type: "scrubber", theme: "ink",
          h2: "Chocolate printer: no margin for error",
          lede: "A little warmer and the chocolate runs. A little colder and the layers won't stick. The nozzle had to be that fine and that precise.",
          hint: "Tap any photo, swipe, or use the arrows to go from first mess to first success.",
          steps: [
            { src: "img/choc-1.jpg", alt: "Chocolate running off the bed",        chip: "failed", text: "Too warm: it runs" },
            { src: "img/choc-2.jpg", alt: "Blobs of chocolate instead of layers", chip: "failed", text: "Blobs, not layers" },
            { src: "img/choc-3.jpg", alt: "Small chocolate shapes on a napkin",   chip: "tried",  text: "First shapes that held" },
            { src: "img/choc-4.jpg", alt: "Nozzle close to the bed",              chip: "tried",  text: "Dialling in the nozzle" },
            { src: "img/choc-5.jpg", alt: "A printed chocolate spiral vase",      chip: "worked", text: "A spiral vase that stands" }
          ] },

        { type: "strip", theme: "cream", cols: 4,
          title: "Also on the bench: bio and FDM printers",
          intro: "A bio printer for living cells and biomaterials, and desktop FDM machines, from enclosure to wiring to shipping.",
          items: [
            { src: "img/bio-1.jpg", ar: "1/1.05", caption: "Enclosure in CAD" },
            { src: "img/bio-2.jpg", ar: "1/1.05", caption: "Control board, every wire labelled" },
            { src: "img/bio-3.jpg", ar: "1/1.05", caption: "Inside the print head" },
            { src: "img/bio-4.jpg", ar: "1/1.05", chip: "worked", caption: "Packed and shipped" }
          ] }
      ]
    },

    /* ---------------- 05 THE ENERGY LAB ---------------- */
    {
      id: "energylab",
      num: "05",
      title: "The Energy Lab",
      role: "Mechanical design lead: ideation, design, manufacturing, assembly",
      theme: "ink",
      learned: "learned: how to lead a build",
      methods: ["Propulsion trade study", "Powertrain & battery sizing", "Composite layup process"],
      result: "A successful flight test, and the aircraft exhibited at IIIT Hyderabad.",
      cover: { src: "img/el-cover.jpg", alt: "Yayati working on a black composite aircraft on the floor" },
      story: [
        "My first time leading the mechanical design and the team behind it. We built the whole aircraft as a carbon-fibre composite layup, against speed targets, vendor limits and a deadline that hit hard."
      ],
      quote: "But hey, I do work better under pressure.",
      blocks: [
        { type: "strip", theme: "cream", cols: 3,
          title: "A composite airframe, under pressure",
          items: [
            { src: "img/el-1.jpg", ar: "3/2", chip: "tried",  caption: "Simulation on the airframe" },
            { src: "img/el-2.jpg", ar: "3/2", chip: "tried",  caption: "Laying up the moulds" },
            { src: "img/el-3.jpg", ar: "3/2", chip: "worked", caption: "Out of the moulds" }
          ],
          duo: {
            m: { chip: "cost",  label: "Mistake", text: "Near the deadline, I once used vacuum-pump oil in place of epoxy in a layup." },
            r: { chip: "tried", label: "Result",  text: "The flight test was successful, and we exhibited the aircraft at IIIT Hyderabad." }
          } },

        { type: "model", theme: "ink",
          title: "The VTOL, in 3D",
          intro: "A high-endurance surveillance VTOL for surveying and mapping: designed, prototyped and built here. 3 m span.",
          src: "models/vtol.glb", poster: "img/el-3.jpg",
          alt: "Surveillance VTOL UAV, interactive 3D model",
          caption: "Drag it around. On a phone, view it at full size in your room.",
          stillCaption: "The VTOL, out of the moulds",
          orbit: "-35deg 72deg auto" },

        { type: "dl", theme: "butter",
          title: "Alongside",
          items: [
            { dt: "Stingray", dd: "A passion project, more about the art than the engineering." },
            { dt: "Surveillance drone and guided ground vehicles" },
            { dt: "Robotics workshops in schools", dd: "With a friend at an NGO working to keep girls from dropping out of school, our CTO and I ran robotics workshops in those schools." }
          ],
          render: { src: "img/stingray.jpg", alt: "Rendered Stingray drone", caption: "Stingray, rendered" },
          /* interactive 3D: drop the file at this path and it switches on; until then the render above shows */
          model: { src: "models/stingray.glb", alt: "Stingray drone, interactive 3D model", caption: "Stingray. Explore it in 3D." } }
      ]
    },

    /* ---------------- 06 INVENTE ---------------- */
    {
      id: "invente",
      num: "06",
      title: "Invente",
      role: "Mechanical design engineer: jet UAVs, from the Army design bureau to the Ladakh runway",
      theme: "orange",
      learned: "learned: how much more I need to know",
      methods: ["XFLR5 aerodynamic analysis", "ANSYS structural FEA", "Composite airframe design", "High-altitude flight test"],
      result: "The first jet UAV in India to take off at 5,400 m. Two of three aircraft lost to the cold.",
      cover: { src: "img/inv-cover.jpg", alt: "Army officers standing behind a camouflaged jet UAV on a Ladakh runway" },
      story: [
        "A company of two: the CEO and me. I worked on jet aircraft from product ideation with the Army design bureau, to setting up manufacturing for the orders, to building the prototype, testing it and crashing it."
      ],
      quote: "We started with three aircraft. We ended with one.",
      blocks: [
        { type: "columns", theme: "cream", ratio: "1fr 1.2fr", kicker: "Why this shape, and not another",
          left: [
            { type: "text", h2: "Designing for 400 km/h",
              paras: [
                "The catapult launcher was harder to manufacture than to design. At those speeds it had to be very thin and very light.",
                "The hardest part was the problem itself: everything worked at standard altitude, but India's high-altitude terrain gets brutally cold."
              ],
              aside: { label: "Mentor", text: "At Invente I met Captain Randhawa, my mentor ever since. He taught me to fly aircraft, and to be exacting about everything, from charged batteries to how you hold a screwdriver." } }
          ],
          right: [
            { type: "figure", src: "img/inv-1.jpg", ar: "2/1", alt: "Two people preparing the jet UAV on the runway" },
            { type: "figure", src: "img/inv-2.jpg", ar: "2/1", alt: "Inspecting under the wing" }
          ] },

        { type: "log", theme: "ink",
          h2: "Ladakh: the failure log",
          altitude: 5400,
          entries: [
            { part: "Engine",            text: "Flamed out mid-air while climbing at 5,400 m. The fuel got too cold to burn." },
            { part: "Batteries",         text: "Puffed up before we could even get them into the heat chambers." },
            { part: "3D-printed parts",  text: "Rated for −40 °C on paper. They turned brittle and crumbled." },
            { part: "Camera motors",     text: "Burned out during testing at higher speeds." },
            { part: "Fleet",             text: "Three aircraft at the start. One at the end.", fleet: true }
          ],
          figure: { src: "img/crash.jpg", ar: "5/4", chip: "failed", alt: "Two people walking over crash debris in the Ladakh desert", caption: "What a high-altitude crash looks like" } },

        { type: "bigquote", theme: "blue",
          kicker: "After the flameout",
          lede: "I was so disappointed that the Army general himself tried to cheer me up: we should be proud it took off at that altitude at all. We were the first in India to do it.",
          quote: "They deserve more than what we can give today. They deserve what they imagine, and as engineers it's our duty to make that possible.",
          script: "That's why I'm applying." }
      ]
    },

    /* ---------------- 07 DEBRIEF ---------------- */
    {
      id: "debrief",
      num: "07",
      title: "Looking back, with what I know now",
      role: "Debrief",
      theme: "cream",
      learned: "learned: which questions I can't answer yet",
      cover: { src: "img/hero.jpg", alt: "A pellet-printed lattice part with stringy failed walls" },
      story: [
        "Every failure in this portfolio ended in a question I couldn't answer with trial and error alone."
      ],
      quote: "I'm not satisfied with what I know now.",
      blocks: [
        { type: "flips", theme: "cream",
          title: "Looking back, with what I know now",
          intro: "Each card is something I did. Flip it for the question I'd ask now.",
          items: [
            { did: "Metal 3D-printed a part for a surveillance drone", ask: "Could it have been CNC-machined instead?" },
            { did: "3D-printed parts rated for −40 °C on paper crumbled in the cold", ask: "How do materials behave at real temperatures, not datasheet ones?" },
            { did: "Engine flameout and puffed batteries at 5,400 m", ask: "How do you design propulsion and power for thin, cold air?" },
            { did: "Pellets melting at the top of the nozzle", ask: "Where does the heat actually go, and how do I predict it before printing?" }
          ],
          script: "I'm not satisfied with what I know now." },

        { type: "loop", theme: "ink",
          title: "How I work",
          intro: "Six steps, on repeat. Pick one.",
          steps: [
            { name: "Design",  text: "Start in CAD from the constraint that hurts most: weight, speed or cost.",
              tools: ["Siemens NX", "SolidWorks", "Fusion 360", "GD&T", "DFMA"],
              example: "Watchdog was designed around a strict mass budget." },
            { name: "Analyse", text: "Check the idea with numbers before cutting material.",
              tools: ["XFLR5", "ANSYS", "Altair OptiStruct", "SimScale CFD", "MATLAB"],
              example: "The jet UAV: XFLR5 for aerodynamics, ANSYS for structural FEA." },
            { name: "Build",   text: "Make it myself, so I know what the drawing left out.",
              tools: ["Composite layup", "Vacuum bagging", "Additive manufacturing"],
              example: "I set up the lab's carbon-fibre process and hand-laid the wings and fuselage." },
            { name: "Test",    text: "Fly it or run it in the conditions it was meant for.",
              tools: ["Multirotor & fixed-wing pilot", "Data acquisition", "Ground control station"],
              example: "High-altitude trials at 5,400 m in Ladakh." },
            { name: "Break",   text: "Something fails. Write down exactly how.",
              example: "Printed parts rated for −40 °C crumbled. The engine flamed out." },
            { name: "Rebuild", text: "Change one thing and go again.",
              example: "Five chocolate-printer attempts, from a puddle to a spiral vase." }
          ],
          script: "The loop works. What it can't do is tell me why before I build." },

        { type: "research", theme: "blue",
          title: "Why a master's",
          lede: "Every failure in this portfolio ended in a question I couldn't answer with trial and error alone. I want the theory, the labs and the people to answer them properly.",
          items: [
            { name: "Composite & structural mechanics",
              question: "How do composite and printed structures behave at real temperatures and loads, not datasheet ones?",
              evidence: [
                { chapter: "college",   text: "My first carbon-fibre part, vacuum bagged, for the SAE aircraft" },
                { chapter: "energylab", text: "Set up the lab's composite process and hand-laid the wings and fuselage" },
                { chapter: "invente",   text: "A composite airframe for 400 km/h; printed parts turned brittle in the cold" }
              ],
              learn: "Mechanics of composite materials, fracture and fatigue, and how materials behave in extreme cold." },
            { name: "Structural optimization",
              question: "How light can a structure get before it stops being safe, and can I know that before I build it?",
              evidence: [
                { chapter: "dbz",       text: "Topology optimization on structural printer parts" },
                { chapter: "insidefpv", text: "A 121-minute world record through weight optimization and a strict mass budget" },
                { chapter: "debrief",   text: "A metal-printed part I would now ask: could it have been machined?" }
              ],
              learn: "Finite element methods, topology and shape optimization, and design for manufacture." },
            { name: "UAV & aircraft design",
              question: "How do you design propulsion, power and airframe together for thin, cold air?",
              evidence: [
                { chapter: "college",   text: "Design & Modelling Head; top 10 at SAE Aero Design USA" },
                { chapter: "energylab", text: "Propulsion trade study for a 50-minute VTOL" },
                { chapter: "invente",   text: "A jet UAV from XFLR5 and ANSYS to flight trials in Ladakh" }
              ],
              learn: "Aerodynamics, flight mechanics, and propulsion and thermal management at altitude." }
          ],
          script: "That's why I'm applying." },

        { type: "bench", theme: "butter",
          title: "Off the bench",
          intro: "Drag, swipe or use the arrows.",
          items: [
            /* any photo can open a gallery of more photos and videos, e.g.
               { src: "img/hob-1.jpg", caption: "Bouldering", gallery: [
                   { src: "img/boulder-2.jpg", caption: "..." },
                   { video: "media/boulder-1.mp4", poster: "img/boulder-1.jpg", caption: "..." } ] }, */
            { src: "img/hob-1.jpg", caption: "Bouldering" },
            { src: "img/hob-2.jpg", caption: "Riding" },
            { src: "img/hob-3.jpg", caption: "Trekking" },
            { src: "img/hob-4.jpg", caption: "Painting small things" },
            { src: "img/hob-5.jpg", caption: "Airfields at night" }
          ] }
      ]
    }
  ],

  finale: {
    lines: ["Still building.", "Still <em>breaking</em> things.", "On purpose now."],
    copy: "Copy email",
    write: "Write to me"
  }
};
