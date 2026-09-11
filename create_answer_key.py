#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Answer Key Generator for Vocabulary Practice Workbook
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

def add_logo_and_header(c, page_num, total_pages):
    """Add logo, header, and page number to each page"""
    # Add logo
    logo_path = "/home/ubuntu/.cursor/projects/workspace/assets/01a085c5-1ece-7f9b-a6f5-21f3fe32e9d2.jpg"
    c.drawImage(logo_path, 2*cm, 27*cm, width=4*cm, height=1.5*cm, preserveAspectRatio=True)
    
    # Add title
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(10.5*cm, 27.5*cm, "ANSWER KEY")
    
    c.setFont("Helvetica", 10)
    c.drawCentredString(10.5*cm, 26.8*cm, "Vocabulary Practice Workbook - Grade 9")
    c.drawCentredString(10.5*cm, 26.3*cm, "Units 1-2-3 - Global Success")
    
    # Add page number at bottom
    c.setFont("Helvetica", 9)
    c.drawCentredString(10.5*cm, 1.5*cm, f"Page {page_num} of {total_pages}")
    
    # Draw separator line
    c.setStrokeColor(HexColor("#E8A144"))
    c.setLineWidth(2)
    c.line(2*cm, 25.8*cm, 19*cm, 25.8*cm)

# Answer key
answers = [
    {
        "title": "PART 1: MULTIPLE CHOICE - VOCABULARY",
        "subtitle": "Unit 1: Local Community",
        "answers": [
            "1. B", "2. A", "3. B", "4. B", "5. A",
            "6. B", "7. A", "8. A", "9. A", "10. B"
        ],
        "explanations": [
            "1. B - handicrafts (plural noun for handmade items)",
            "2. A - destination (a place to which someone is going)",
            "3. B - peaceful (adjective describing atmosphere)",
            "4. B - facilities (plural noun for services)",
            "5. A - preserve (verb meaning to keep/maintain)",
            "6. B - transportation (noun for transport system)",
            "7. A - urban (adjective meaning city/town)",
            "8. A - community (adjective describing the centre)",
            "9. A - produce (noun meaning fresh food products)",
            "10. B - streets (plural noun)"
        ]
    },
    {
        "title": "PART 2: PHRASAL VERBS",
        "subtitle": "Unit 1: Local Community",
        "answers": [
            "1. A", "2. A", "3. B", "4. A", "5. A",
            "6. A", "7. A", "8. A", "9. A", "10. A"
        ],
        "explanations": [
            "1. A - look up (search for information)",
            "2. A - pull down (demolish/destroy buildings)",
            "3. B - passes down (hand down traditions)",
            "4. A - set up (establish/create)",
            "5. A - look after (take care of)",
            "6. A - grown up (developed/matured)",
            "7. A - take off (remove clothing/shoes)",
            "8. A - deal with (handle a problem)",
            "9. A - take place (occur/happen)",
            "10. A - carry on (continue)"
        ]
    },
    {
        "title": "PART 3: WORD FORMS",
        "subtitle": "Unit 2: City Life",
        "answers": [
            "1. B", "2. A", "3. B", "4. A", "5. A",
            "6. A", "7. A", "8. A", "9. A", "10. A"
        ],
        "explanations": [
            "1. B - convenient (adjective describing lifestyle)",
            "2. A - pollution (noun form)",
            "3. B - beauty (noun form)",
            "4. A - opportunities (plural noun)",
            "5. A - congestion (noun form)",
            "6. A - commercial (adjective describing centres)",
            "7. A - density (noun form)",
            "8. A - inequality (noun form with negative prefix)",
            "9. A - mobility (noun form)",
            "10. A - infrastructure (noun form)"
        ]
    },
    {
        "title": "PART 4: SYNONYMS",
        "subtitle": "Unit 2: City Life",
        "answers": [
            "1. A", "2. A", "3. A", "4. A", "5. A",
            "6. A", "7. A", "8. A", "9. A", "10. A"
        ],
        "explanations": [
            "1. A - packed (filled with people)",
            "2. A - lively (full of activity)",
            "3. A - expensive (costly)",
            "4. A - tense (causing stress)",
            "5. A - towers over (stands high above)",
            "6. A - effective (working well)",
            "7. A - growing (becoming larger)",
            "8. A - varied (different types)",
            "9. A - serious (important/significant)",
            "10. A - outstanding (excellent/superior)"
        ]
    },
    {
        "title": "PART 5: ANTONYMS",
        "subtitle": "Unit 2: City Life",
        "answers": [
            "1. A", "2. A", "3. A", "4. A", "5. A",
            "6. A", "7. A", "8. A", "9. A", "10. A"
        ],
        "explanations": [
            "1. A - calm (opposite of hectic/busy)",
            "2. A - quiet (opposite of noisy)",
            "3. A - ancient (opposite of modern)",
            "4. A - clean (opposite of polluted)",
            "5. A - cheap (opposite of expensive)",
            "6. A - low (opposite of high)",
            "7. A - scarce (opposite of abundant)",
            "8. A - quickly (opposite of slowly)",
            "9. A - dangerous (opposite of safe)",
            "10. A - neglected (opposite of well-maintained)"
        ]
    },
    {
        "title": "PART 6: PREPOSITIONAL PHRASES",
        "subtitle": "Unit 3: Healthy Living for Teens",
        "answers": [
            "1. A", "2. A", "3. A", "4. A", "5. A",
            "6. A", "7. A", "8. A", "9. A", "10. A"
        ],
        "explanations": [
            "1. A - good for (beneficial to)",
            "2. A - addicted to (dependent on)",
            "3. A - concentrate on (focus on)",
            "4. A - lead to (result in)",
            "5. A - interested in (having interest in)",
            "6. A - suffer from (experience pain/problem)",
            "7. A - essential for (necessary for)",
            "8. A - good at (skilled at)",
            "9. A - aware of (knowing about)",
            "10. A - consist of (be made up of)"
        ]
    },
    {
        "title": "PART 7: VOCABULARY",
        "subtitle": "Unit 3: Healthy Living for Teens",
        "answers": [
            "1. A", "2. A", "3. A", "4. A", "5. A",
            "6. A", "7. A", "8. A", "9. A", "10. A"
        ],
        "explanations": [
            "1. A - balanced (adjective describing diet)",
            "2. A - sleep (noun form)",
            "3. A - physical (adjective describing activity)",
            "4. A - mental (adjective describing health)",
            "5. A - balance (noun form)",
            "6. A - nutrition (noun meaning nourishment)",
            "7. A - habits (plural noun)",
            "8. A - well-being (state of being healthy)",
            "9. A - pressure (noun meaning force/influence)",
            "10. A - manage (verb form)"
        ]
    },
    {
        "title": "PART 8: PHRASAL VERBS & EXPRESSIONS",
        "subtitle": "Unit 3: Healthy Living for Teens",
        "answers": [
            "1. A", "2. A", "3. A", "4. A", "5. A",
            "6. A", "7. A", "8. A", "9. A", "10. A"
        ],
        "explanations": [
            "1. A - give up (stop/quit)",
            "2. A - cut down on (reduce)",
            "3. A - stay away from (avoid)",
            "4. A - take up (start doing)",
            "5. A - stay up (remain awake)",
            "6. A - break (stop/change habits)",
            "7. A - include (add/incorporate)",
            "8. A - keep (maintain/stay)",
            "9. A - maintain (keep/preserve)",
            "10. A - skip (miss/omit)"
        ]
    },
    {
        "title": "PART 9: MIXED PRACTICE",
        "subtitle": "Units 1-2-3 Review",
        "answers": [
            "1. A", "2. C", "3. A", "4. A", "5. A",
            "6. A", "7. A", "8. A", "9. A", "10. A"
        ],
        "explanations": [
            "1. A - appearance (noun form)",
            "2. C - cope with (deal with/manage)",
            "3. A - transportation (noun form)",
            "4. A - get (get enough sleep - collocation)",
            "5. A - promote (verb meaning support/encourage)",
            "6. A - stressful (adjective form)",
            "7. A - pay (pay attention - collocation)",
            "8. A - infrastructure (basic facilities)",
            "9. A - moving (continuous form of move)",
            "10. A - includes (third person singular verb)"
        ]
    },
    {
        "title": "PART 10: COMPREHENSIVE REVIEW",
        "subtitle": "Units 1-2-3 Final Practice",
        "answers": [
            "1. A", "2. A", "3. A", "4. A", "5. A",
            "6. A", "7. A", "8. A", "9. A", "10. D"
        ],
        "explanations": [
            "1. A - passed down (phrasal verb)",
            "2. A - congestion (traffic congestion - collocation)",
            "3. A - give up (stop/quit)",
            "4. A - facilities (services/amenities)",
            "5. A - deal with (handle/manage)",
            "6. A - famous for (well-known for)",
            "7. A - rural (countryside, opposite of urban)",
            "8. A - balance (noun form)",
            "9. A - take place (phrasal verb meaning happen)",
            "10. D - All are correct (focus/concentrate/pay attention)"
        ]
    }
]

def create_answer_key():
    """Create the answer key PDF"""
    filename = "/workspace/Answer_Key_Vocabulary_Workbook_Grade9.pdf"
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    
    total_pages = len(answers)
    
    for page_num, page_content in enumerate(answers, 1):
        # Add logo and header
        add_logo_and_header(c, page_num, total_pages)
        
        # Add title and subtitle
        y_position = 24.5*cm
        c.setFont("Helvetica-Bold", 12)
        c.drawString(2*cm, y_position, page_content["title"])
        
        y_position -= 0.6*cm
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(2*cm, y_position, page_content["subtitle"])
        
        y_position -= 0.8*cm
        
        # Add quick answers section
        c.setFont("Helvetica-Bold", 11)
        c.drawString(2*cm, y_position, "Quick Answers:")
        y_position -= 0.5*cm
        
        c.setFont("Helvetica", 10)
        # Display answers in two columns
        col1_answers = page_content["answers"][:5]
        col2_answers = page_content["answers"][5:]
        
        for i in range(5):
            c.drawString(2.5*cm, y_position, col1_answers[i])
            if i < len(col2_answers):
                c.drawString(9*cm, y_position, col2_answers[i])
            y_position -= 0.4*cm
        
        y_position -= 0.5*cm
        
        # Add detailed explanations
        c.setFont("Helvetica-Bold", 11)
        c.drawString(2*cm, y_position, "Detailed Explanations:")
        y_position -= 0.5*cm
        
        c.setFont("Helvetica", 8.5)
        for explanation in page_content["explanations"]:
            if y_position < 3*cm:
                c.showPage()
                add_logo_and_header(c, page_num, total_pages)
                y_position = 24.5*cm
            
            c.drawString(2.3*cm, y_position, explanation)
            y_position -= 0.35*cm
        
        # Finish the page
        c.showPage()
    
    # Save the PDF
    c.save()
    print(f"Answer key created successfully: {filename}")

if __name__ == "__main__":
    create_answer_key()
