#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vocabulary Practice Workbook Generator
For Grade 9 - Hanoi High School Entrance Exam 2025-2026
Units 1-2-3 Global Success
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
import textwrap

def add_logo_and_header(c, page_num, total_pages):
    """Add logo, header, and page number to each page"""
    # Add logo
    logo_path = "/home/ubuntu/.cursor/projects/workspace/assets/01a085c5-1ece-7f9b-a6f5-21f3fe32e9d2.jpg"
    c.drawImage(logo_path, 2*cm, 27*cm, width=4*cm, height=1.5*cm, preserveAspectRatio=True)
    
    # Add title
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(10.5*cm, 27.5*cm, "VOCABULARY PRACTICE WORKBOOK")
    
    c.setFont("Helvetica", 10)
    c.drawCentredString(10.5*cm, 26.8*cm, "Grade 9 - Hanoi High School Entrance Exam 2025-2026")
    c.drawCentredString(10.5*cm, 26.3*cm, "Units 1-2-3 - Global Success")
    
    # Add page number at bottom
    c.setFont("Helvetica", 9)
    c.drawCentredString(10.5*cm, 1.5*cm, f"Page {page_num} of {total_pages}")
    
    # Draw separator line
    c.setStrokeColor(HexColor("#E8A144"))
    c.setLineWidth(2)
    c.line(2*cm, 25.8*cm, 19*cm, 25.8*cm)

def wrap_text(text, width):
    """Wrap text to fit within specified width"""
    return textwrap.fill(text, width=width)

# Exercise content based on Units 1-2-3 Global Success Grade 9
exercises = [
    # PAGE 1
    {
        "title": "PART 1: MULTIPLE CHOICE - VOCABULARY",
        "subtitle": "Unit 1: Local Community",
        "questions": [
            {
                "q": "1. The artisan is very skilled at making _______ products like pottery and baskets.",
                "options": ["A. handicraft", "B. handicrafts", "C. handcraft", "D. handcrafts"],
                "note": ""
            },
            {
                "q": "2. The local market is a popular _______ for tourists who want to buy souvenirs.",
                "options": ["A. destination", "B. destine", "C. destiny", "D. destined"],
                "note": ""
            },
            {
                "q": "3. My grandparents live in a small village with a _______ atmosphere.",
                "options": ["A. peace", "B. peaceful", "C. peacefully", "D. peacefulness"],
                "note": ""
            },
            {
                "q": "4. The _______ in this area is very convenient with many shops and services.",
                "options": ["A. facility", "B. facilities", "C. facilitate", "D. facilitation"],
                "note": ""
            },
            {
                "q": "5. We need to _______ the old traditions and pass them to the next generation.",
                "options": ["A. preserve", "B. preservation", "C. preservative", "D. preserving"],
                "note": ""
            },
            {
                "q": "6. The city has good public _______ including buses and trains.",
                "options": ["A. transport", "B. transportation", "C. transporting", "D. transported"],
                "note": ""
            },
            {
                "q": "7. Many young people are moving to _______ areas to find better jobs.",
                "options": ["A. urban", "B. rural", "C. suburb", "D. countryside"],
                "note": ""
            },
            {
                "q": "8. The _______ centre offers various activities for teenagers.",
                "options": ["A. community", "B. commune", "C. communicate", "D. communication"],
                "note": ""
            },
            {
                "q": "9. Street vendors sell fresh _______ every morning in the market.",
                "options": ["A. produce", "B. product", "C. production", "D. productive"],
                "note": ""
            },
            {
                "q": "10. The narrow _______ in the old quarter are full of charm and history.",
                "options": ["A. street", "B. streets", "C. road", "D. lane"],
                "note": ""
            },
        ]
    },
    # PAGE 2
    {
        "title": "PART 2: PHRASAL VERBS",
        "subtitle": "Unit 1: Local Community",
        "questions": [
            {
                "q": "1. Can you _______ this word in the dictionary? I don't know what it means.",
                "options": ["A. look up", "B. look after", "C. look for", "D. look at"],
                "note": ""
            },
            {
                "q": "2. The city council decided to _______ the old buildings in the historic district.",
                "options": ["A. pull down", "B. set up", "C. carry out", "D. get on"],
                "note": ""
            },
            {
                "q": "3. My grandmother often _______ the stories about her childhood in the village.",
                "options": ["A. brings up", "B. passes down", "C. hands in", "D. takes after"],
                "note": ""
            },
            {
                "q": "4. They decided to _______ a new community centre in our neighbourhood.",
                "options": ["A. set up", "B. turn down", "C. carry on", "D. go on"],
                "note": ""
            },
            {
                "q": "5. We should _______ the traditional craft villages in our area.",
                "options": ["A. look after", "B. run out of", "C. deal with", "D. come back"],
                "note": ""
            },
            {
                "q": "6. The tourism industry has _______ rapidly in this region.",
                "options": ["A. grown up", "B. come up", "C. turned up", "D. gone up"],
                "note": ""
            },
            {
                "q": "7. Please _______ your shoes before entering the temple.",
                "options": ["A. take off", "B. put on", "C. turn on", "D. get off"],
                "note": ""
            },
            {
                "q": "8. The local authorities want to _______ with the problem of traffic congestion.",
                "options": ["A. deal with", "B. look forward to", "C. get on with", "D. put up with"],
                "note": ""
            },
            {
                "q": "9. The workshop will _______ next Saturday at the community hall.",
                "options": ["A. take place", "B. take part", "C. take care", "D. take off"],
                "note": ""
            },
            {
                "q": "10. Many young artisans want to _______ their family traditions.",
                "options": ["A. carry on", "B. go on", "C. keep on", "D. hold on"],
                "note": ""
            },
        ]
    },
    # PAGE 3
    {
        "title": "PART 3: WORD FORMS",
        "subtitle": "Unit 2: City Life",
        "questions": [
            {
                "q": "1. The city is known for its _______ lifestyle and modern facilities. (CONVENIENCE)",
                "options": ["A. convenience", "B. convenient", "C. conveniently", "D. inconvenient"],
                "note": ""
            },
            {
                "q": "2. Air _______ is one of the biggest problems in big cities. (POLLUTE)",
                "options": ["A. pollution", "B. polluted", "C. pollutant", "D. pollute"],
                "note": ""
            },
            {
                "q": "3. The _______ of the city attracts many tourists every year. (BEAUTY)",
                "options": ["A. beautiful", "B. beauty", "C. beautifully", "D. beautify"],
                "note": ""
            },
            {
                "q": "4. Living in the city gives you more _______ to find good jobs. (OPPORTUNITY)",
                "options": ["A. opportunities", "B. opportune", "C. opportunist", "D. opportunity"],
                "note": ""
            },
            {
                "q": "5. The city government is trying to reduce traffic _______. (CONGEST)",
                "options": ["A. congestion", "B. congested", "C. congest", "D. congestive"],
                "note": ""
            },
            {
                "q": "6. There are many _______ centres in the city for shopping and entertainment. (COMMERCE)",
                "options": ["A. commercial", "B. commerce", "C. commercially", "D. commercialize"],
                "note": ""
            },
            {
                "q": "7. The _______ in this neighbourhood is very high during rush hours. (DENSE)",
                "options": ["A. density", "B. dense", "C. densely", "D. denseness"],
                "note": ""
            },
            {
                "q": "8. Many people are concerned about the _______ gap between rich and poor. (EQUAL)",
                "options": ["A. inequality", "B. equal", "C. equally", "D. equality"],
                "note": ""
            },
            {
                "q": "9. The new metro system will improve urban _______. (MOBILE)",
                "options": ["A. mobility", "B. mobile", "C. mobilize", "D. mobilization"],
                "note": ""
            },
            {
                "q": "10. We need better _______ to deal with the growing population. (INFRASTRUTURE)",
                "options": ["A. infrastructure", "B. infrastructural", "C. infrastructures", "D. infrastructuring"],
                "note": ""
            },
        ]
    },
    # PAGE 4
    {
        "title": "PART 4: SYNONYMS",
        "subtitle": "Unit 2: City Life",
        "questions": [
            {
                "q": "1. The city is very crowded during rush hour.\nWhich word is CLOSEST in meaning to 'crowded'?",
                "options": ["A. packed", "B. empty", "C. quiet", "D. spacious"],
                "note": ""
            },
            {
                "q": "2. The downtown area is bustling with activity.\nWhich word is CLOSEST in meaning to 'bustling'?",
                "options": ["A. lively", "B. peaceful", "C. boring", "D. silent"],
                "note": ""
            },
            {
                "q": "3. The cost of living in the city is very high.\nWhich word is CLOSEST in meaning to 'high'?",
                "options": ["A. expensive", "B. cheap", "C. low", "D. reasonable"],
                "note": ""
            },
            {
                "q": "4. Many people find city life stressful.\nWhich word is CLOSEST in meaning to 'stressful'?",
                "options": ["A. tense", "B. relaxing", "C. comfortable", "D. easy"],
                "note": ""
            },
            {
                "q": "5. The skyscraper dominates the city skyline.\nWhich word is CLOSEST in meaning to 'dominates'?",
                "options": ["A. towers over", "B. hides from", "C. disappears from", "D. looks at"],
                "note": ""
            },
            {
                "q": "6. Public transport is efficient in this city.\nWhich word is CLOSEST in meaning to 'efficient'?",
                "options": ["A. effective", "B. slow", "C. useless", "D. poor"],
                "note": ""
            },
            {
                "q": "7. The urban sprawl is expanding rapidly.\nWhich word is CLOSEST in meaning to 'expanding'?",
                "options": ["A. growing", "B. shrinking", "C. stopping", "D. reducing"],
                "note": ""
            },
            {
                "q": "8. The city offers diverse entertainment options.\nWhich word is CLOSEST in meaning to 'diverse'?",
                "options": ["A. varied", "B. limited", "C. similar", "D. boring"],
                "note": ""
            },
            {
                "q": "9. Traffic congestion is a major problem.\nWhich word is CLOSEST in meaning to 'major'?",
                "options": ["A. serious", "B. minor", "C. small", "D. unimportant"],
                "note": ""
            },
            {
                "q": "10. The city has excellent healthcare facilities.\nWhich word is CLOSEST in meaning to 'excellent'?",
                "options": ["A. outstanding", "B. poor", "C. terrible", "D. bad"],
                "note": ""
            },
        ]
    },
    # PAGE 5
    {
        "title": "PART 5: ANTONYMS",
        "subtitle": "Unit 2: City Life",
        "questions": [
            {
                "q": "1. Life in the city is very hectic.\nWhich word is OPPOSITE in meaning to 'hectic'?",
                "options": ["A. calm", "B. busy", "C. rushed", "D. fast"],
                "note": ""
            },
            {
                "q": "2. The streets are always noisy during the day.\nWhich word is OPPOSITE in meaning to 'noisy'?",
                "options": ["A. quiet", "B. loud", "C. crowded", "D. busy"],
                "note": ""
            },
            {
                "q": "3. Modern buildings are everywhere in the city.\nWhich word is OPPOSITE in meaning to 'modern'?",
                "options": ["A. ancient", "B. new", "C. contemporary", "D. recent"],
                "note": ""
            },
            {
                "q": "4. The city centre is very polluted.\nWhich word is OPPOSITE in meaning to 'polluted'?",
                "options": ["A. clean", "B. dirty", "C. contaminated", "D. toxic"],
                "note": ""
            },
            {
                "q": "5. Housing in urban areas is expensive.\nWhich word is OPPOSITE in meaning to 'expensive'?",
                "options": ["A. cheap", "B. costly", "C. valuable", "D. high"],
                "note": ""
            },
            {
                "q": "6. The population density is very high.\nWhich word is OPPOSITE in meaning to 'high'?",
                "options": ["A. low", "B. tall", "C. elevated", "D. raised"],
                "note": ""
            },
            {
                "q": "7. The city offers abundant job opportunities.\nWhich word is OPPOSITE in meaning to 'abundant'?",
                "options": ["A. scarce", "B. plenty", "C. many", "D. numerous"],
                "note": ""
            },
            {
                "q": "8. Traffic moves slowly during rush hour.\nWhich word is OPPOSITE in meaning to 'slowly'?",
                "options": ["A. quickly", "B. gradually", "C. steadily", "D. carefully"],
                "note": ""
            },
            {
                "q": "9. The neighbourhood is very safe at night.\nWhich word is OPPOSITE in meaning to 'safe'?",
                "options": ["A. dangerous", "B. secure", "C. protected", "D. guarded"],
                "note": ""
            },
            {
                "q": "10. Public spaces are well-maintained.\nWhich word is OPPOSITE in meaning to 'well-maintained'?",
                "options": ["A. neglected", "B. cared for", "C. preserved", "D. kept"],
                "note": ""
            },
        ]
    },
    # PAGE 6
    {
        "title": "PART 6: PREPOSITIONAL PHRASES",
        "subtitle": "Unit 3: Healthy Living for Teens",
        "questions": [
            {
                "q": "1. Regular exercise is good _______ your health.",
                "options": ["A. for", "B. at", "C. in", "D. on"],
                "note": ""
            },
            {
                "q": "2. Many teenagers are addicted _______ social media.",
                "options": ["A. to", "B. with", "C. in", "D. at"],
                "note": ""
            },
            {
                "q": "3. You should concentrate _______ your studies during exam time.",
                "options": ["A. on", "B. at", "C. in", "D. for"],
                "note": ""
            },
            {
                "q": "4. Eating fast food can lead _______ health problems.",
                "options": ["A. to", "B. in", "C. at", "D. for"],
                "note": ""
            },
            {
                "q": "5. I'm really interested _______ learning about healthy lifestyles.",
                "options": ["A. in", "B. on", "C. at", "D. for"],
                "note": ""
            },
            {
                "q": "6. Students often suffer _______ stress during exams.",
                "options": ["A. from", "B. with", "C. in", "D. at"],
                "note": ""
            },
            {
                "q": "7. Getting enough sleep is essential _______ teenagers.",
                "options": ["A. for", "B. to", "C. in", "D. at"],
                "note": ""
            },
            {
                "q": "8. She's very good _______ managing her time effectively.",
                "options": ["A. at", "B. in", "C. on", "D. for"],
                "note": ""
            },
            {
                "q": "9. Teens should be aware _______ the dangers of smoking.",
                "options": ["A. of", "B. in", "C. at", "D. with"],
                "note": ""
            },
            {
                "q": "10. A balanced diet consists _______ various types of food.",
                "options": ["A. of", "B. in", "C. with", "D. from"],
                "note": ""
            },
        ]
    },
    # PAGE 7
    {
        "title": "PART 7: VOCABULARY",
        "subtitle": "Unit 3: Healthy Living for Teens",
        "questions": [
            {
                "q": "1. Eating a _______ diet with plenty of fruits and vegetables is important.",
                "options": ["A. balanced", "B. balance", "C. balancing", "D. balances"],
                "note": ""
            },
            {
                "q": "2. Many teenagers don't get enough _______ and feel tired all the time.",
                "options": ["A. sleep", "B. asleep", "C. sleeping", "D. sleepy"],
                "note": ""
            },
            {
                "q": "3. Regular _______ activity helps reduce stress and anxiety.",
                "options": ["A. physical", "B. physics", "C. physically", "D. physician"],
                "note": ""
            },
            {
                "q": "4. Spending too much time on screens can affect your _______ health.",
                "options": ["A. mental", "B. mentally", "C. mentality", "D. mention"],
                "note": ""
            },
            {
                "q": "5. It's important to maintain a healthy _______ between study and leisure.",
                "options": ["A. balance", "B. balanced", "C. balancing", "D. balances"],
                "note": ""
            },
            {
                "q": "6. Junk food contains a lot of calories but little _______.",
                "options": ["A. nutrition", "B. nutritious", "C. nutritional", "D. nutrient"],
                "note": ""
            },
            {
                "q": "7. Teenagers need to develop good study _______ for academic success.",
                "options": ["A. habits", "B. habitat", "C. habitual", "D. habitually"],
                "note": ""
            },
            {
                "q": "8. Yoga and meditation can help improve _______.",
                "options": ["A. well-being", "B. good-being", "C. wellness", "D. healthiness"],
                "note": ""
            },
            {
                "q": "9. Peer _______ can influence teenagers' lifestyle choices.",
                "options": ["A. pressure", "B. press", "C. pressing", "D. pressed"],
                "note": ""
            },
            {
                "q": "10. Students should _______ their time wisely to avoid burnout.",
                "options": ["A. manage", "B. management", "C. manager", "D. manageable"],
                "note": ""
            },
        ]
    },
    # PAGE 8
    {
        "title": "PART 8: PHRASAL VERBS & EXPRESSIONS",
        "subtitle": "Unit 3: Healthy Living for Teens",
        "questions": [
            {
                "q": "1. You should _______ smoking if you want to stay healthy.",
                "options": ["A. give up", "B. give in", "C. give out", "D. give away"],
                "note": ""
            },
            {
                "q": "2. I need to _______ my bad eating habits.",
                "options": ["A. cut down on", "B. cut off", "C. cut in", "D. cut out"],
                "note": ""
            },
            {
                "q": "3. The doctor told me to _______ fatty foods.",
                "options": ["A. stay away from", "B. get away with", "C. go away from", "D. take away from"],
                "note": ""
            },
            {
                "q": "4. She decided to _______ yoga to reduce stress.",
                "options": ["A. take up", "B. take off", "C. take in", "D. take out"],
                "note": ""
            },
            {
                "q": "5. Many students _______ late to finish their homework.",
                "options": ["A. stay up", "B. get up", "C. wake up", "D. stand up"],
                "note": ""
            },
            {
                "q": "6. It's hard to _______ old habits, but it's necessary for a healthier life.",
                "options": ["A. break", "B. make", "C. take", "D. shake"],
                "note": ""
            },
            {
                "q": "7. You need to _______ more fruits and vegetables in your diet.",
                "options": ["A. include", "B. exclude", "C. conclude", "D. preclude"],
                "note": ""
            },
            {
                "q": "8. Regular exercise can help you _______ fit and healthy.",
                "options": ["A. keep", "B. make", "C. take", "D. have"],
                "note": ""
            },
            {
                "q": "9. Try to _______ a positive attitude towards life.",
                "options": ["A. maintain", "B. contain", "C. obtain", "D. sustain"],
                "note": ""
            },
            {
                "q": "10. Don't _______ meals if you want to maintain a healthy weight.",
                "options": ["A. skip", "B. slip", "C. strip", "D. trip"],
                "note": ""
            },
        ]
    },
    # PAGE 9
    {
        "title": "PART 9: MIXED PRACTICE",
        "subtitle": "Units 1-2-3 Review",
        "questions": [
            {
                "q": "1. The _______ of the village has changed a lot over the years.",
                "options": ["A. appearance", "B. appear", "C. appearing", "D. appeared"],
                "note": ""
            },
            {
                "q": "2. She's trying to _______ with her busy schedule and family life.",
                "options": ["A. cope", "B. copy", "C. cope with", "D. copy with"],
                "note": ""
            },
            {
                "q": "3. The city's _______ system needs to be improved.",
                "options": ["A. transportation", "B. transport", "C. transporting", "D. transported"],
                "note": ""
            },
            {
                "q": "4. Teenagers should _______ enough sleep every night.",
                "options": ["A. get", "B. take", "C. have", "D. make"],
                "note": ""
            },
            {
                "q": "5. The local government wants to _______ traditional crafts.",
                "options": ["A. promote", "B. promotion", "C. promoting", "D. promoted"],
                "note": ""
            },
            {
                "q": "6. Living in the city can be very _______ at times.",
                "options": ["A. stressful", "B. stress", "C. stressed", "D. stressing"],
                "note": ""
            },
            {
                "q": "7. You need to _______ more attention to your health.",
                "options": ["A. pay", "B. give", "C. take", "D. make"],
                "note": ""
            },
            {
                "q": "8. The _______ in this neighbourhood is excellent.",
                "options": ["A. infrastructure", "B. structure", "C. construction", "D. destruction"],
                "note": ""
            },
            {
                "q": "9. Many young people are _______ to the city for better opportunities.",
                "options": ["A. moving", "B. moved", "C. move", "D. movement"],
                "note": ""
            },
            {
                "q": "10. A healthy lifestyle _______ regular exercise and a balanced diet.",
                "options": ["A. includes", "B. including", "C. include", "D. included"],
                "note": ""
            },
        ]
    },
    # PAGE 10
    {
        "title": "PART 10: COMPREHENSIVE REVIEW",
        "subtitle": "Units 1-2-3 Final Practice",
        "questions": [
            {
                "q": "1. The artisan _______ down his skills to his children.",
                "options": ["A. passed", "B. carried", "C. handed", "D. gave"],
                "note": ""
            },
            {
                "q": "2. Traffic _______ is a serious problem in big cities.",
                "options": ["A. congestion", "B. jam", "C. crowd", "D. busy"],
                "note": ""
            },
            {
                "q": "3. You should _______ bad habits for a healthier life.",
                "options": ["A. give up", "B. turn up", "C. make up", "D. take up"],
                "note": ""
            },
            {
                "q": "4. The city offers many _______ for entertainment and shopping.",
                "options": ["A. facilities", "B. faculties", "C. factories", "D. faculties"],
                "note": ""
            },
            {
                "q": "5. Teenagers need to learn how to _______ stress effectively.",
                "options": ["A. deal with", "B. do with", "C. make with", "D. take with"],
                "note": ""
            },
            {
                "q": "6. The local market is famous _______ its fresh produce.",
                "options": ["A. for", "B. with", "C. in", "D. at"],
                "note": ""
            },
            {
                "q": "7. Many people prefer _______ life because it's more peaceful.",
                "options": ["A. rural", "B. urban", "C. city", "D. town"],
                "note": ""
            },
            {
                "q": "8. It's important to maintain a _______ between work and life.",
                "options": ["A. balance", "B. balancing", "C. balanced", "D. balances"],
                "note": ""
            },
            {
                "q": "9. The workshop will _______ place at the community centre.",
                "options": ["A. take", "B. make", "C. do", "D. have"],
                "note": ""
            },
            {
                "q": "10. Students are advised to _______ on their studies during term time.",
                "options": ["A. focus", "B. concentrate", "C. pay attention", "D. All are correct"],
                "note": ""
            },
        ]
    }
]

def create_workbook():
    """Create the vocabulary workbook PDF"""
    filename = "/workspace/Vocabulary_Practice_Workbook_Grade9.pdf"
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    
    total_pages = len(exercises)
    
    for page_num, page_content in enumerate(exercises, 1):
        # Add logo and header
        add_logo_and_header(c, page_num, total_pages)
        
        # Add title and subtitle
        y_position = 24.5*cm
        c.setFont("Helvetica-Bold", 13)
        c.drawString(2*cm, y_position, page_content["title"])
        
        y_position -= 0.6*cm
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(2*cm, y_position, page_content["subtitle"])
        
        y_position -= 0.8*cm
        
        # Add questions
        for idx, question in enumerate(page_content["questions"]):
            # Check if we need to start a new page (though we shouldn't with 10 questions)
            if y_position < 4*cm:
                c.showPage()
                add_logo_and_header(c, page_num, total_pages)
                y_position = 24.5*cm
            
            # Draw question
            c.setFont("Helvetica", 9)
            
            # Handle multi-line questions
            q_lines = question["q"].split('\n')
            for line in q_lines:
                c.drawString(2.3*cm, y_position, line)
                y_position -= 0.4*cm
            
            # Draw options
            for option in question["options"]:
                c.drawString(2.8*cm, y_position, option)
                y_position -= 0.35*cm
            
            y_position -= 0.15*cm  # Extra space between questions
        
        # Finish the page
        c.showPage()
    
    # Save the PDF
    c.save()
    print(f"Workbook created successfully: {filename}")

if __name__ == "__main__":
    create_workbook()
