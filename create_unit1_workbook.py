#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unit 1 Local Community – Grade 9 Global Success
100-question exam-format workbook (Hanoi entrance exam 2025-2026).
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVuBold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))

LOGO = "/home/ubuntu/.cursor/projects/workspace/assets/01a085c5-1ece-7f9b-a6f5-21f3fe32e9d2.jpg"
ORANGE = HexColor("#E8A144")
DARK = HexColor("#222222")
GRAY = HexColor("#555555")
LIGHT = HexColor("#FFF8F0")
LINE = HexColor("#F0D9B5")

W, H = A4
LEFT = 1.6 * cm
RIGHT = W - 1.6 * cm
CONTENT_W = RIGHT - LEFT
TOP_Y = 25.9 * cm
BOTTOM_Y = 1.8 * cm


def wrap(c, text, font, size, max_w):
    words = text.split()
    lines, cur = [], ""
    for word in words:
        trial = word if not cur else cur + " " + word
        if c.stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines or [""]


class Book:
    def __init__(self, path):
        self.c = canvas.Canvas(path, pagesize=A4)
        self.page = 0
        self.y = TOP_Y
        self.section = ""
        self.pages_total_placeholder = True

    def header(self):
        c = self.c
        try:
            c.drawImage(
                LOGO, 0.9 * cm, 27.15 * cm,
                width=4.6 * cm, height=1.7 * cm,
                preserveAspectRatio=True, mask="auto",
            )
        except Exception:
            pass
        c.setFillColor(DARK)
        c.setFont("DejaVuBold", 12)
        c.drawCentredString(W / 2 + 0.6 * cm, 28.05 * cm, "LUYỆN CHUYÊN SÂU TỪ VỰNG & NGỮ PHÁP")
        c.setFont("DejaVu", 8.5)
        c.setFillColor(GRAY)
        c.drawCentredString(W / 2 + 0.6 * cm, 27.55 * cm, "Unit 1: Local Community  •  Tiếng Anh 9 Global Success  •  Ôn thi vào 10 Hà Nội 2025–2026")
        if self.section:
            c.setFillColor(ORANGE)
            c.setFont("DejaVuBold", 9)
            c.drawCentredString(W / 2, 26.95 * cm, self.section)
        c.setStrokeColor(ORANGE)
        c.setLineWidth(1.6)
        c.line(LEFT, 26.65 * cm, RIGHT, 26.65 * cm)

    def footer(self):
        c = self.c
        c.setStrokeColor(ORANGE)
        c.setLineWidth(0.8)
        c.line(LEFT, 1.35 * cm, RIGHT, 1.35 * cm)
        c.setFillColor(GRAY)
        c.setFont("DejaVu", 8)
        c.drawString(LEFT, 0.85 * cm, "English Lab")
        c.drawRightString(RIGHT, 0.85 * cm, "Unit 1 – Local Community")
        c.setFont("DejaVuBold", 8)
        c.setFillColor(DARK)
        c.drawCentredString(W / 2, 0.85 * cm, f"Trang {self.page}")

    def new_page(self, section=None):
        if self.page:
            self.footer()
            self.c.showPage()
        if section:
            self.section = section
        self.page += 1
        self.header()
        self.y = TOP_Y

    def need(self, h):
        if self.y - h < BOTTOM_Y:
            self.new_page()

    def gap(self, h=0.18 * cm):
        self.y -= h

    def band(self, title, subtitle=""):
        self.need(1.7 * cm)
        c = self.c
        c.setFillColor(ORANGE)
        c.roundRect(LEFT, self.y - 0.95 * cm, CONTENT_W, 1.05 * cm, 4, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("DejaVuBold", 10)
        c.drawString(LEFT + 0.25 * cm, self.y - 0.42 * cm, title)
        if subtitle:
            c.setFont("DejaVu", 7.5)
            c.drawString(LEFT + 0.25 * cm, self.y - 0.78 * cm, subtitle)
        self.y -= 1.25 * cm

    def instruction(self, text):
        c = self.c
        lines = wrap(c, text, "DejaVu", 8.2, CONTENT_W)
        self.need(0.32 * cm * len(lines) + 0.25 * cm)
        c.setFillColor(GRAY)
        c.setFont("DejaVu", 8.2)
        for line in lines:
            c.drawString(LEFT, self.y, line)
            self.y -= 0.32 * cm
        self.y -= 0.12 * cm

    def para(self, text, size=9, leading=0.38 * cm, indent=0, bold=False):
        c = self.c
        font = "DejaVuBold" if bold else "DejaVu"
        lines = wrap(c, text, font, size, CONTENT_W - indent)
        self.need(leading * len(lines) + 0.08 * cm)
        c.setFillColor(DARK)
        c.setFont(font, size)
        for line in lines:
            c.drawString(LEFT + indent, self.y, line)
            self.y -= leading
        return len(lines)

    def mcq(self, q, options, layout="h"):
        c = self.c
        q_lines = wrap(c, q, "DejaVu", 9.2, CONTENT_W)
        if layout == "h":
            col_w = CONTENT_W / 4
            if any(c.stringWidth(opt, "DejaVu", 8.2) > col_w - 0.12 * cm for opt in options):
                layout = "v"
        if layout == "h":
            total = 0.38 * cm * len(q_lines) + 0.42 * cm + 0.38 * cm
        else:
            opt_lines = [wrap(c, opt, "DejaVu", 8.4, CONTENT_W - 0.35 * cm) for opt in options]
            total = 0.38 * cm * len(q_lines) + sum(0.34 * cm * len(x) for x in opt_lines) + 0.22 * cm * 4 + 0.28 * cm
        self.need(total)

        c.setFillColor(DARK)
        c.setFont("DejaVu", 9.2)
        for line in q_lines:
            c.drawString(LEFT, self.y, line)
            self.y -= 0.38 * cm
        self.y -= 0.06 * cm

        if layout == "h":
            col_w = CONTENT_W / 4
            c.setFont("DejaVu", 8.2)
            c.setFillColor(DARK)
            for i, opt in enumerate(options):
                x = LEFT + i * col_w
                c.drawString(x, self.y, opt)
            self.y -= 0.55 * cm
        else:
            c.setFont("DejaVu", 8.4)
            for opt in options:
                lines = wrap(c, opt, "DejaVu", 8.4, CONTENT_W - 0.35 * cm)
                for i, line in enumerate(lines):
                    c.drawString(LEFT + 0.2 * cm, self.y, line)
                    self.y -= 0.34 * cm
                self.y -= 0.06 * cm
            self.y -= 0.12 * cm

    def save(self):
        self.footer()
        self.c.save()


# ---------------------------------------------------------------------------
# CONTENT: 100 questions
# ---------------------------------------------------------------------------

PART1 = [  # Vocabulary 1–20
    ("1. The skilled _______ in Bat Trang village can make beautiful vases from clay.",
     ["A. electrician", "B. artisan", "C. firefighter", "D. officer"], "B"),
    ("2. They moved from the noisy city centre to a quiet _______ of Ha Noi last month.",
     ["A. suburb", "B. mall", "C. facility", "D. occasion"], "A"),
    ("3. A _______ is a person whose job is to collect and take away rubbish from the streets.",
     ["A. delivery person", "B. police officer", "C. garbage collector", "D. neighbour"], "C"),
    ("4. Local people try to _______ traditional crafts and pass them on to their children.",
     ["A. destroy", "B. shorten", "C. occupy", "D. preserve"], "D"),
    ("5. The new neighbourhood has excellent public _______ such as parks, schools and hospitals.",
     ["A. facilities", "B. fragrances", "C. properties", "D. functions"], "A"),
    ("6. Bat Trang pottery is a well-known _______ that attracts thousands of visitors every year.",
     ["A. electrical wire", "B. tourist attraction", "C. shopping mall", "D. delivery person"], "B"),
    ("7. This silk scarf is not a copy; it is an _______ product made by local weavers.",
     ["A. original", "B. urban", "C. electrical", "D. crowded"], "A"),
    ("8. Pho and bun cha are _______ foods that many visitors want to try in Ha Noi.",
     ["A. suburb", "B. speciality", "C. property", "D. function"], "B"),
    ("9. When there is a fire in the neighbourhood, we should call a _______.",
     ["A. firefighter", "B. artisan", "C. tourist", "D. weaver"], "A"),
    ("10. The _______ of this community centre is to organise activities for teenagers.",
     ["A. fragrance", "B. pottery", "C. function", "D. suburb"], "C"),
    ("11. A(n) _______ came to our house yesterday to repair the broken lights.",
     ["A. electrician", "B. artisan", "C. collector", "D. visitor"], "A"),
    ("12. Handmade baskets and conical hats are traditional Vietnamese _______.",
     ["A. suburbs", "B. handicrafts", "C. facilities", "D. occasions"], "B"),
    ("13. The smell of incense in the old temple has a special _______.",
     ["A. fragrance", "B. property", "C. community", "D. electrician"], "A"),
    ("14. Please _______ the recycling into paper, plastic and glass before you throw it away.",
     ["A. preserve", "B. instruct", "C. sort", "D. wander"], "C"),
    ("15. Our _______ is friendly; people often chat in front of their houses in the evening.",
     ["A. neighbourhood", "B. pottery", "C. fragrance", "D. attraction"], "A"),
    ("16. The museum is _______ for its collection of ancient pottery from the Red River Delta.",
     ["A. world-famous", "B. electrical", "C. original", "D. local"], "A"),
    ("17. Parents should _______ their children how to cross the street safely.",
     ["A. shorten", "B. instruct", "C. occupy", "D. collect"], "B"),
    ("18. A _______ brings parcels and food to people's houses in our community.",
     ["A. firefighter", "B. delivery person", "C. potter", "D. weaver"], "B"),
    ("19. The old houses in the craft village are valuable cultural _______.",
     ["A. malls", "B. suburbs", "C. property", "D. wires"], "C"),
    ("20. The local _______ encourages residents to keep the streets clean and green.",
     ["A. pottery", "B. fragrance", "C. community", "D. occasion"], "C"),
]

PART2 = [  # Phrasal verbs 21–35
    ("21. Whenever I visit a new place, I spend time _______ to see what is there.",
     ["A. looking around", "B. coming back", "C. running out", "D. cutting down"], "A"),
    ("22. We _______ from our hometown last Sunday after a three-day family visit.",
     ["A. found out", "B. came back", "C. handed down", "D. looked for"], "B"),
    ("23. In my village, artisans usually _______ their skills to their eldest children.",
     ["A. take care of", "B. get on with", "C. hand down", "D. cut down on"], "C"),
    ("24. If you want to _______ about our community, visit the local museum.",
     ["A. find out", "B. look after", "C. come back", "D. go out"], "A"),
    ("25. When we are not at home, our neighbour kindly _______ our cats.",
     ["A. looks around", "B. takes care of", "C. runs out of", "D. cuts down on"], "B"),
    ("26. I think we will _______ our new neighbours because they are helpful and friendly.",
     ["A. get on with", "B. hand down", "C. look for", "D. come back"], "A"),
    ("27. This old photo _______ me _______ the time we first moved to this neighbourhood.",
     ["A. reminds / of", "B. looks / around", "C. takes / after", "D. gets / on"], "A"),
    ("28. The village has to _______ plastic bags to keep the environment clean.",
     ["A. come back", "B. cut down on", "C. look around", "D. hand down"], "B"),
    ("29. We need to buy more clay because the workshop has _______ it.",
     ["A. run out of", "B. got on with", "C. looked around", "D. come back from"], "A"),
    ("30. Can you _______ my keys? I left them somewhere in the community centre.",
     ["A. look for", "B. hand down", "C. take care", "D. find out"], "A"),
    ("31. After the trip, they promised to _______ to the craft village next summer.",
     ["A. cut down", "B. come back", "C. run out", "D. get on"], "B"),
    ("32. Traditional recipes in this village were _______ from mother to daughter.",
     ["A. passed down", "B. looked around", "C. found out", "D. gone out"], "A"),
    ("33. 'Pass down' is closest in meaning to _______.",
     ["A. throw away", "B. hand down", "C. look after", "D. come back"], "B"),
    ("34. Who will _______ the community garden while the volunteers are away?",
     ["A. look around", "B. look after", "C. look for", "D. look up"], "B"),
    ("35. Teenagers in our neighbourhood often _______ at the weekend to play badminton.",
     ["A. go out", "B. run out", "C. hand down", "D. cut down"], "A"),
]

PART3 = [  # Collocations 36–45
    ("36. Ha Long Bay is a famous tourist _______.",
     ["A. attract", "B. attractive", "C. attraction", "D. attracted"], "C"),
    ("37. Bun cha is a speciality _______ of Ha Noi.",
     ["A. food", "B. craft", "C. mall", "D. helper"], "A"),
    ("38. There is a traditional _______ village near our new house.",
     ["A. craft", "B. crafted", "C. crafting", "D. craftsman"], "A"),
    ("39. Many families prefer living in the city _______ because it is convenient.",
     ["A. middle", "B. centre", "C. hearted", "D. point"], "B"),
    ("40. A community _______ such as a firefighter or a garbage collector helps keep the area safe.",
     ["A. helper", "B. helping", "C. helped", "D. helpfulness"], "A"),
    ("41. Please keep the neighbourhood _______ by not throwing rubbish on the street.",
     ["A. clean", "B. clearly", "C. cleaning", "D. cleaner"], "A"),
    ("42. Visitors can buy original _______ made by local artisans at the market.",
     ["A. products", "B. producing", "C. production", "D. productive"], "A"),
    ("43. The local authority gave residents useful _______ about recycling.",
     ["A. advise", "B. advice", "C. advisable", "D. advised"], "B"),
    ("44. Children should _______ the law and not ride motorbikes under age.",
     ["A. obey", "B. obeying", "C. obedient", "D. obedience"], "A"),
    ("45. Our school often _______ community activities such as cleaning the park.",
     ["A. takes part in", "B. takes place", "C. takes after", "D. takes off"], "A"),
]

PART4 = [  # Grammar 46–60 (Wh + to-inf, whether to, phrasal verb form)
    ("46. We didn't know _______ to buy furniture for our new house.",
     ["A. where", "B. why", "C. which", "D. whose"], "A"),
    ("47. She asked a lady _______ to the bus station.",
     ["A. how getting", "B. how to get", "C. how get", "D. how she get"], "B"),
    ("48. I really don't know what _______ next in this new neighbourhood.",
     ["A. do", "B. doing", "C. to do", "D. did"], "C"),
    ("49. They haven't decided _______ to organise the community festival.",
     ["A. when", "B. why to", "C. whose", "D. whom"], "A"),
    ("50. He wondered _______ to ask for help when his motorbike broke down.",
     ["A. who", "B. why", "C. whose", "D. whom to he"], "A"),
    ("51. Tell me _______ to pay for the pottery class, before or after the lesson.",
     ["A. why", "B. when", "C. who", "D. which"], "B"),
    ("52. No one could explain _______ we had to leave the workshop so early.",
     ["A. why to", "B. why", "C. how to", "D. what to"], "B"),
    ("53. We'll have to decide _______ to go ahead with the clean-up or not.",
     ["A. if", "B. that", "C. whether", "D. what"], "C"),
    ("54. I wasn't sure _______ to do when I got lost in the old quarter.",
     ["A. what", "B. why", "C. whose", "D. whom"], "A"),
    ("55. Mike wants to know how _______ the pottery wheel.",
     ["A. use", "B. using", "C. to use", "D. used"], "C"),
    ("56. We were wondering where _______ dinner after visiting the craft village.",
     ["A. to cook", "B. cooking", "C. cook", "D. cooked"], "A"),
    ("57. You cannot say 'I don't know why to go there'. The correct sentence is _______.",
     ["A. I don't know why going there", "B. I don't know why I should go there",
      "C. I don't know why to going there", "D. I don't know why go there"], "B"),
    ("58. The artisan showed the visitors _______ to make a small clay cup.",
     ["A. how", "B. why", "C. whose", "D. whom"], "A"),
    ("59. Have they decided _______ to start the community project?",
     ["A. what time", "B. when", "C. why", "D. whose"], "B"),
    ("60. I have no idea _______ to contact if there is a power cut in our street.",
     ["A. who", "B. why", "C. whose", "D. which"], "A"),
]

PART5 = [  # Closest in meaning 61–70  (vertical options)
    ("61. I don't know what I should do in this new neighbourhood.",
     ["A. I don't know what to do in this new neighbourhood.",
      "B. I don't know doing what in this new neighbourhood.",
      "C. I don't know what do I in this new neighbourhood.",
      "D. I don't know what I doing in this new neighbourhood."], "A"),
    ("62. She asked him how she could get to the bus station.",
     ["A. She asked him how getting to the bus station.",
      "B. She asked him how to get to the bus station.",
      "C. She asked him how could she get to the bus station.",
      "D. She asked him how she gets the bus station."], "B"),
    ("63. They haven't decided where they should stay during the festival.",
     ["A. They haven't decided where staying during the festival.",
      "B. They haven't decided where they staying during the festival.",
      "C. They haven't decided where to stay during the festival.",
      "D. They haven't decided staying where during the festival."], "C"),
    ("64. Please take care of my cats when I am away.",
     ["A. Please look after my cats when I am away.",
      "B. Please look for my cats when I am away.",
      "C. Please look around my cats when I am away.",
      "D. Please look up my cats when I am away."], "A"),
    ("65. He returned to his hometown after two years in the city.",
     ["A. He came back to his hometown after two years in the city.",
      "B. He found out his hometown after two years in the city.",
      "C. He handed down his hometown after two years in the city.",
      "D. He ran out of his hometown after two years in the city."], "A"),
    ("66. The skill was given to the children by their grandparents.",
     ["A. The skill was looked around by their grandparents.",
      "B. The skill was cut down on by their grandparents.",
      "C. The skill was handed down to the children by their grandparents.",
      "D. The skill was taken care of the children by their grandparents."], "C"),
    ("67. I have a good relationship with my new neighbours.",
     ["A. I get on with my new neighbours.",
      "B. I look around my new neighbours.",
      "C. I run out of my new neighbours.",
      "D. I come back my new neighbours."], "A"),
    ("68. This souvenir makes me remember my first trip to the craft village.",
     ["A. This souvenir looks after my first trip to the craft village.",
      "B. This souvenir reminds me of my first trip to the craft village.",
      "C. This souvenir finds out my first trip to the craft village.",
      "D. This souvenir takes care of my first trip to the craft village."], "B"),
    ("69. We discovered some interesting facts about our local community.",
     ["A. We found out some interesting facts about our local community.",
      "B. We looked after some interesting facts about our local community.",
      "C. We came back some interesting facts about our local community.",
      "D. We handed down some interesting facts about our local community."], "A"),
    ("70. Let's walk around the pottery village to see what is there.",
     ["A. Let's look after the pottery village to see what is there.",
      "B. Let's look for the pottery village to see what is there.",
      "C. Let's look around the pottery village to see what is there.",
      "D. Let's look up the pottery village to see what is there."], "C"),
]


CLOZE1_TITLE = "Passage 1: A new neighbourhood"
CLOZE1_INTRO = (
    "Read the following passage and mark the letter A, B, C, or D on your answer sheet to indicate "
    "the correct word or phrase that best fits each of the numbered blanks from 71 to 78."
)
CLOZE1_TEXT = [
    "Last month, Mi's family moved to a new house in a (71) _______ of Ha Noi. The streets are wider and there are fewer people than in their old neighbourhood in the city (72) _______. The area has all the (73) _______ they need: shopping malls, parks and hospitals. There is even a (74) _______ village nearby, so Mi can watch artisans make pottery at the weekend. The neighbours are kind. When Mi was (75) _______ the way to the bus station, a lady came and showed her how to get there. Mi hopes she will (76) _______ them. The friendly people (77) _______ her of the time her family first arrived in the city and received useful (78) _______ from the local community.",
]
CLOZE1 = [
    ("71.", ["A. suburb", "B. mall", "C. attraction", "D. fragrance"], "A"),
    ("72.", ["A. side", "B. centre", "C. helper", "D. wire"], "B"),
    ("73.", ["A. facilities", "B. artisans", "C. occasions", "D. products"], "A"),
    ("74.", ["A. craft", "B. crafted", "C. crafting", "D. crafts"], "A"),
    ("75.", ["A. looking after", "B. looking for", "C. looking up", "D. looking down"], "B"),
    ("76.", ["A. get on with", "B. run out of", "C. cut down on", "D. hand down"], "A"),
    ("77.", ["A. remember", "B. remind", "C. collect", "D. preserve"], "B"),
    ("78.", ["A. advise", "B. advisable", "C. advice", "D. advised"], "C"),
]

CLOZE2_TITLE = "Passage 2: A pottery village"
CLOZE2_INTRO = (
    "Read the following passage and mark the letter A, B, C, or D on your answer sheet to indicate "
    "the correct word or phrase that best fits each of the numbered blanks from 79 to 86."
)
CLOZE2_TEXT = [
    "Bat Trang is a (79) _______ pottery village on the bank of the Red River. For centuries, local (80) _______ have made bowls, vases and souvenirs from clay. They still (81) _______ traditional methods and (82) _______ their skills to younger family members. Visitors love (83) _______ the workshops and even trying to make a small cup themselves. Many products are (84) _______, not copies, so tourists buy them as gifts. The village has become a popular tourist (85) _______. To keep the river clean, families are asked to (86) _______ plastic waste and sort rubbish carefully.",
]
CLOZE2 = [
    ("79.", ["A. tradition", "B. traditional", "C. traditionally", "D. traditions"], "B"),
    ("80.", ["A. artisans", "B. firefighters", "C. officers", "D. collectors"], "A"),
    ("81.", ["A. destroy", "B. forget", "C. preserve", "D. shorten"], "C"),
    ("82.", ["A. hand down", "B. run out", "C. look for", "D. cut off"], "A"),
    ("83.", ["A. looking after", "B. looking around", "C. looking up", "D. looking down"], "B"),
    ("84.", ["A. original", "B. origin", "C. originally", "D. originate"], "A"),
    ("85.", ["A. attract", "B. attractive", "C. attraction", "D. attracted"], "C"),
    ("86.", ["A. cut down on", "B. get on with", "C. come back", "D. go out"], "A"),
]


READ1_TITLE = "Reading 1: Community helpers"
READ1_INTRO = (
    "Read the following passage and mark the letter A, B, C, or D on your answer sheet to indicate "
    "the correct answer to each of the following questions from 87 to 93."
)
READ1_PARAS = [
    "Every neighbourhood needs people who keep it safe, clean and comfortable. These community helpers do different jobs, but they all serve the people around them.",
    "Garbage collectors start work very early. They go from street to street, take away rubbish and help keep the environment healthy. Without them, the neighbourhood would quickly become dirty and full of disease. Electricians repair broken lights and dangerous electrical wires so that families can live safely at home. When a fire starts, firefighters arrive as fast as they can. They put out the fire and rescue people from burning buildings. Police officers patrol the streets, especially at night, and remind residents to obey the law.",
    "Delivery persons have become more important in modern communities. They bring food, medicine and parcels to people's doors, which is useful for the elderly. Many helpers also instruct children about road safety and recycling at the community centre.",
    "Living in a strong community means showing respect for these workers. A simple 'thank you' or a cup of tea on a hot day can make their hard work feel valued.",
]
READ1 = [
    ("87. What is the passage mainly about?",
     ["A. How to become a firefighter in a big city",
      "B. Different community helpers and their roles",
      "C. Why people move to the suburbs",
      "D. How to make traditional pottery"], "B"),
    ("88. According to the passage, garbage collectors _______.",
     ["A. only work at night in the city centre",
      "B. repair electrical wires in old houses",
      "C. help keep the neighbourhood clean and healthy",
      "D. teach children how to put out a fire"], "C"),
    ("89. The word 'them' in paragraph 2 refers to _______.",
     ["A. diseases", "B. streets", "C. families", "D. garbage collectors"], "D"),
    ("90. Why are electricians important in a neighbourhood?",
     ["A. They patrol the streets at night.",
      "B. They put out fires in tall buildings.",
      "C. They repair lights and dangerous electrical wires.",
      "D. They collect rubbish from every house."], "C"),
    ("91. Delivery persons are especially useful for _______.",
     ["A. tourists in craft villages",
      "B. elderly people who need things brought home",
      "C. police officers on night duty",
      "D. artisans who sell pottery"], "B"),
    ("92. The word 'patrol' in paragraph 2 is closest in meaning to _______.",
     ["A. walk around to watch and protect",
      "B. hand down traditional skills",
      "C. cut down on plastic waste",
      "D. look after pets at home"], "A"),
    ("93. Which of the following is TRUE according to the passage?",
     ["A. Community helpers all do exactly the same job.",
      "B. Children never learn about recycling at the community centre.",
      "C. Saying thank you can make helpers feel valued.",
      "D. Firefighters only work in the suburbs."], "C"),
]


READ2_TITLE = "Reading 2: Life in a craft village"
READ2_INTRO = (
    "Read the following passage and mark the letter A, B, C, or D on your answer sheet to indicate "
    "the correct answer to each of the following questions from 94 to 100."
)
READ2_PARAS = [
    "Lan grew up in a small craft village about twenty kilometres from Ha Noi's city centre. Almost every family there works with clay. In the morning, the air is full of the fragrance of wet earth and wood smoke from the kilns. Lan's grandfather is a well-known artisan. He still uses original tools and refuses to make cheap copies for tourists. 'A good bowl must last for years,' he often says.",
    "When Lan was little, she did not know what to do with her free time. Then her grandfather showed her how to sit at the pottery wheel. At first the clay flew everywhere. Slowly she learnt where to place her hands and when to add water. Now she can make simple cups. The family hope she will preserve the craft and that the skill will be handed down once more.",
    "At weekends, visitors come to look around the workshops. They buy souvenirs and speciality snacks sold along the river. The village has become a tourist attraction, which brings money but also rubbish. Lan's community has decided to cut down on plastic bags and to take care of the riverbank. 'If we do not protect our neighbourhood,' Lan says, 'people will not want to come back.'",
]
READ2 = [
    ("94. Where did Lan grow up?",
     ["A. In a shopping mall in the city centre",
      "B. In a craft village not far from Ha Noi",
      "C. In a suburb of Ho Chi Minh City",
      "D. On a floating market in the Mekong"], "B"),
    ("95. What is Lan's grandfather like as an artisan?",
     ["A. He only makes cheap copies for tourists.",
      "B. He has stopped working with clay.",
      "C. He values quality and uses original tools.",
      "D. He wants to move to the city centre."], "C"),
    ("96. The word 'kilns' in paragraph 1 is closest in meaning to _______.",
     ["A. ovens used for baking pottery",
      "B. buses used for tourists",
      "C. bags used for rubbish",
      "D. tools used by electricians"], "A"),
    ("97. How did Lan learn to make pottery?",
     ["A. She watched videos in a shopping mall.",
      "B. A delivery person taught her at the weekend.",
      "C. Her grandfather instructed her at the pottery wheel.",
      "D. She found out by reading a city museum guide."], "C"),
    ("98. What problem has tourism brought to the village?",
     ["A. There are no more visitors at weekends.",
      "B. The village has more rubbish to deal with.",
      "C. Artisans have run out of clay completely.",
      "D. Children are not allowed to make cups."], "B"),
    ("99. The phrase 'handed down' in paragraph 2 is closest in meaning to _______.",
     ["A. thrown away", "B. looked for", "C. passed to the next generation", "D. cut down on"], "C"),
    ("100. What does Lan believe about protecting the neighbourhood?",
     ["A. It is unnecessary if the village is famous.",
      "B. Only the police officer should do it.",
      "C. It helps visitors want to return.",
      "D. It will stop all tourists from coming."], "C"),
]


COVER_POINTS = [
    "100 câu trắc nghiệm A–B–C–D, bám sát format đề vào 10 Hà Nội 2025–2026",
    "Phần 1. Từ vựng Unit 1 Local Community (20 câu)",
    "Phần 2. Phrasal verbs (15 câu): look around, come back, hand down, find out, take care of…",
    "Phần 3. Collocation (10 câu): tourist attraction, speciality food, craft village…",
    "Phần 4. Ngữ pháp (15 câu): Question word + to-infinitive; whether + to-V",
    "Phần 5. Chọn câu gần nghĩa nhất / nghĩa không đổi (10 câu)",
    "Phần 6. Hai bài đọc đục lỗ (16 câu) – chủ đề cộng đồng địa phương & làng nghề",
    "Phần 7. Hai bài đọc hiểu (14 câu)",
    "Thời gian gợi ý: 90 phút  •  Đáp án ở file riêng",
]


def build_exercise_pdf(path):
    b = Book(path)

    # Cover
    b.new_page("ENGLISH LAB")
    b.y = 24.8 * cm
    b.c.setFillColor(ORANGE)
    b.c.roundRect(LEFT, 21.6 * cm, CONTENT_W, 3.5 * cm, 8, fill=1, stroke=0)
    b.c.setFillColor(white)
    b.c.setFont("DejaVuBold", 16)
    b.c.drawCentredString(W / 2, 24.2 * cm, "LUYỆN CHUYÊN SÂU")
    b.c.setFont("DejaVuBold", 14)
    b.c.drawCentredString(W / 2, 23.5 * cm, "TỪ VỰNG & NGỮ PHÁP")
    b.c.setFont("DejaVuBold", 12)
    b.c.drawCentredString(W / 2, 22.7 * cm, "UNIT 1: LOCAL COMMUNITY")
    b.c.setFont("DejaVu", 9.5)
    b.c.drawCentredString(W / 2, 22.05 * cm, "Tiếng Anh 9 – Global Success  |  Ôn thi vào 10 Hà Nội")
    b.y = 21.1 * cm

    b.para("Nội dung học liệu bám sát SGK Tiếng Anh 9 Global Success, Unit 1:", 9.2, 0.4 * cm)
    b.gap(0.15 * cm)
    for p in COVER_POINTS:
        b.para("•  " + p, 9, 0.4 * cm)
    b.gap(0.35 * cm)
    b.para("Hướng dẫn làm bài: Khoanh chữ cái A, B, C hoặc D ứng với đáp án đúng. Với câu đồng nghĩa, chọn câu có nghĩa gần nhất với câu gốc.", 9, 0.38 * cm)
    b.gap(0.2 * cm)
    b.para("Từ vựng trọng tâm: artisan, suburb, facilities, handicraft, pottery, preserve, neighbourhood, speciality food, tourist attraction, community helper, garbage collector, firefighter, electrician, original, fragrance…", 8.5, 0.36 * cm)

    # Part 1
    b.new_page("PHẦN 1. TỪ VỰNG (Questions 1–20)")
    b.band("PHẦN 1. VOCABULARY  •  Questions 1–20",
           "Mark the letter A, B, C, or D on your answer sheet to indicate the correct answer.")
    b.instruction("Chọn từ/cụm từ thích hợp để hoàn thành mỗi câu sau. Từ vựng thuộc Unit 1: cộng đồng địa phương, nghề thủ công, người giúp đỡ cộng đồng.")
    for q, opts, _ in PART1:
        b.mcq(q, opts, "h")

    # Part 2
    b.new_page("PHẦN 2. PHRASAL VERBS (Questions 21–35)")
    b.band("PHẦN 2. PHRASAL VERBS  •  Questions 21–35",
           "Mark the letter A, B, C, or D on your answer sheet to indicate the correct answer.")
    b.instruction("Chọn cụm động từ đúng. Ngữ liệu Unit 1: look around, come back, hand down / pass down, find out, take care of, get on with, remind of, cut down on, run out of, look for, go out.")
    for q, opts, _ in PART2:
        b.mcq(q, opts, "h")

    # Part 3
    b.new_page("PHẦN 3. COLLOCATION (Questions 36–45)")
    b.band("PHẦN 3. COLLOCATION  •  Questions 36–45",
           "Mark the letter A, B, C, or D on your answer sheet to indicate the correct answer.")
    b.instruction("Chọn từ kết hợp đúng (collocation) với từ cho sẵn trong câu.")
    for q, opts, _ in PART3:
        b.mcq(q, opts, "h")

    # Part 4
    b.new_page("PHẦN 4. NGỮ PHÁP (Questions 46–60)")
    b.band("PHẦN 4. GRAMMAR  •  Questions 46–60",
           "Question words before to-infinitives  •  whether + to-V")
    b.instruction("Ngữ pháp trọng tâm Unit 1: what/where/when/who/how + to-V sau know, decide, ask, wonder, tell… Không dùng why + to-V. Câu Yes/No dùng whether + to-V (không dùng if + to-V).")
    for q, opts, _ in PART4:
        b.mcq(q, opts, "h")

    # Part 5
    b.new_page("PHẦN 5. CÂU CÙNG NGHĨA (Questions 61–70)")
    b.band("PHẦN 5. CLOSEST IN MEANING  •  Questions 61–70",
           "Mark the letter A, B, C, or D to indicate the sentence CLOSEST in meaning to the original.")
    b.instruction("Khoanh câu có nghĩa không đổi / gần nghĩa nhất với câu đã cho (dạng đề vào 10 Hà Nội).")
    for q, opts, _ in PART5:
        b.mcq(q, opts, "v")

    # Cloze 1
    b.new_page("PHẦN 6. ĐỌC ĐỤC LỖ – Bài 1 (Questions 71–78)")
    b.band("PHẦN 6A. CLOZE TEST 1  •  Questions 71–78", CLOZE1_TITLE)
    b.instruction(CLOZE1_INTRO)
    b.gap(0.1 * cm)
    for line in CLOZE1_TEXT:
        b.para(line, 9.1, 0.40 * cm)
    b.gap(0.2 * cm)
    for q, opts, _ in CLOZE1:
        b.mcq(q, opts, "h")

    # Cloze 2
    b.new_page("PHẦN 6. ĐỌC ĐỤC LỖ – Bài 2 (Questions 79–86)")
    b.band("PHẦN 6B. CLOZE TEST 2  •  Questions 79–86", CLOZE2_TITLE)
    b.instruction(CLOZE2_INTRO)
    b.gap(0.1 * cm)
    for line in CLOZE2_TEXT:
        b.para(line, 9.1, 0.40 * cm)
    b.gap(0.2 * cm)
    for q, opts, _ in CLOZE2:
        b.mcq(q, opts, "h")

    # Reading 1
    b.new_page("PHẦN 7. ĐỌC HIỂU – Bài 1 (Questions 87–93)")
    b.band("PHẦN 7A. READING COMPREHENSION 1  •  Questions 87–93", READ1_TITLE)
    b.instruction(READ1_INTRO)
    b.gap(0.08 * cm)
    for para in READ1_PARAS:
        b.para(para, 9, 0.38 * cm)
        b.gap(0.12 * cm)
    for q, opts, _ in READ1:
        b.mcq(q, opts, "v")

    # Reading 2
    b.new_page("PHẦN 7. ĐỌC HIỂU – Bài 2 (Questions 94–100)")
    b.band("PHẦN 7B. READING COMPREHENSION 2  •  Questions 94–100", READ2_TITLE)
    b.instruction(READ2_INTRO)
    b.gap(0.08 * cm)
    for para in READ2_PARAS:
        b.para(para, 9, 0.38 * cm)
        b.gap(0.12 * cm)
    for q, opts, _ in READ2:
        b.mcq(q, opts, "v")

    b.save()
    return b.page


def build_answer_pdf(path):
    b = Book(path)
    b.new_page("ĐÁP ÁN  •  UNIT 1 LOCAL COMMUNITY")
    b.band("ĐÁP ÁN NHANH", "100 câu  •  Khoanh đúng rồi đối chiếu giải thích ngắn bên dưới.")

    groups = [
        ("Phần 1. Từ vựng (1–20)", PART1),
        ("Phần 2. Phrasal verbs (21–35)", PART2),
        ("Phần 3. Collocation (36–45)", PART3),
        ("Phần 4. Ngữ pháp (46–60)", PART4),
        ("Phần 5. Câu cùng nghĩa (61–70)", PART5),
        ("Phần 6A. Đục lỗ 1 (71–78)", CLOZE1),
        ("Phần 6B. Đục lỗ 2 (79–86)", CLOZE2),
        ("Phần 7A. Đọc hiểu 1 (87–93)", READ1),
        ("Phần 7B. Đọc hiểu 2 (94–100)", READ2),
    ]

    notes = {
        "1": "artisan = thợ thủ công",
        "2": "suburb = ngoại ô",
        "3": "garbage collector = người thu gom rác",
        "4": "preserve = bảo tồn",
        "5": "facilities = cơ sở vật chất",
        "6": "tourist attraction = điểm thu hút du khách",
        "7": "original = nguyên bản",
        "8": "speciality food = món đặc sản",
        "9": "firefighter = lính cứu hỏa",
        "10": "function = chức năng",
        "11": "electrician = thợ điện",
        "12": "handicrafts = đồ thủ công",
        "13": "fragrance = hương thơm",
        "14": "sort = phân loại",
        "15": "neighbourhood = khu phố/khu lân cận",
        "16": "world-famous = nổi tiếng thế giới",
        "17": "instruct = hướng dẫn",
        "18": "delivery person = người giao hàng",
        "19": "property = tài sản",
        "20": "community = cộng đồng",
        "21": "look around = đi xem xung quanh",
        "22": "come back = trở về",
        "23": "hand down = truyền lại",
        "24": "find out = tìm hiểu/tìm ra",
        "25": "take care of = chăm sóc",
        "26": "get on with = hòa thuận với",
        "27": "remind sb of = gợi nhớ",
        "28": "cut down on = cắt giảm",
        "29": "run out of = hết, cạn",
        "30": "look for = tìm kiếm",
        "31": "come back = trở lại",
        "32": "pass down = truyền lại (công thức/kỹ năng)",
        "33": "pass down = hand down",
        "34": "look after = take care of",
        "35": "go out = ra ngoài",
        "36": "tourist attraction (collocation)",
        "37": "speciality food (collocation)",
        "38": "craft village (collocation)",
        "39": "city centre (collocation)",
        "40": "community helper (collocation)",
        "41": "keep … clean",
        "42": "original products",
        "43": "give advice (danh từ không đếm được)",
        "44": "obey the law",
        "45": "take part in = tham gia",
        "46": "where + to-V",
        "47": "how to get",
        "48": "what to do",
        "49": "when + to-V",
        "50": "who + to-V",
        "51": "when + to-V",
        "52": "Không dùng why + to-V → dùng mệnh đề why + S + V",
        "53": "whether + to-V (không dùng if + to-V)",
        "54": "what to do",
        "55": "how to use",
        "56": "where to cook",
        "57": "why + S + V, không why + to-V",
        "58": "how + to-V",
        "59": "when + to-V",
        "60": "who + to-V",
        "61": "what I should do = what to do",
        "62": "how she could get = how to get",
        "63": "where they should stay = where to stay",
        "64": "take care of = look after",
        "65": "return = come back",
        "66": "give to children = hand down",
        "67": "have a good relationship = get on with",
        "68": "make sb remember = remind sb of",
        "69": "discover = find out",
        "70": "walk around to see = look around",
        "71": "suburb phù hợp ngữ cảnh chuyển nhà",
        "72": "city centre",
        "73": "facilities",
        "74": "craft village",
        "75": "look for the way = tìm đường",
        "76": "get on with neighbours",
        "77": "remind sb of",
        "78": "advice (noun)",
        "79": "traditional (adj)",
        "80": "artisans",
        "81": "preserve methods",
        "82": "hand down skills",
        "83": "look around workshops",
        "84": "original products",
        "85": "tourist attraction",
        "86": "cut down on plastic",
        "87": "ý chính: community helpers",
        "88": "chi tiết đoạn 2",
        "89": "them = garbage collectors",
        "90": "repair lights and wires",
        "91": "useful for the elderly",
        "92": "patrol = tuần tra",
        "93": "thank you làm họ cảm thấy được trân trọng",
        "94": "craft village gần Hà Nội",
        "95": "original tools, không làm hàng giả",
        "96": "kiln = lò nung gốm",
        "97": "grandfather instructed her",
        "98": "tourism → rubbish",
        "99": "handed down = truyền đời",
        "100": "bảo vệ làng → khách muốn come back",
    }

    for title, items in groups:
        b.need(1.2 * cm)
        b.c.setFillColor(ORANGE)
        b.c.setFont("DejaVuBold", 10)
        b.c.drawString(LEFT, b.y, title)
        b.y -= 0.48 * cm

        # quick answers row
        answers = [ans for _, _, ans in items]
        # extract question numbers from first item text
        nums = []
        for q, _, ans in items:
            num = q.split(".", 1)[0].split()[0] if q[0].isdigit() else q.rstrip(".")
            nums.append((num, ans))

        line = "   ".join(f"{n}.{a}" for n, a in nums)
        wrapped = wrap(b.c, line, "DejaVuBold", 9, CONTENT_W)
        b.c.setFillColor(DARK)
        b.c.setFont("DejaVuBold", 9)
        for wline in wrapped:
            b.need(0.38 * cm)
            b.c.drawString(LEFT, b.y, wline)
            b.y -= 0.38 * cm
        b.y -= 0.12 * cm

        for num, ans in nums:
            note = notes.get(num, "")
            text = f"{num}. {ans}" + (f"  –  {note}" if note else "")
            b.para(text, 8.2, 0.34 * cm)
        b.gap(0.22 * cm)

    b.save()
    return b.page


def main():
    ex_path = "/workspace/Unit1_Local_Community_Grade9.pdf"
    ans_path = "/workspace/Unit1_Local_Community_DapAn.pdf"
    n1 = build_exercise_pdf(ex_path)
    n2 = build_answer_pdf(ans_path)
    print(f"EXERCISE_PAGES={n1}")
    print(f"ANSWER_PAGES={n2}")
    print(f"EXERCISE={ex_path}")
    print(f"ANSWER={ans_path}")


if __name__ == "__main__":
    main()
