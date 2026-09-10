#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fixed Advanced Vocabulary Workbook Generator
LUYỆN CHUYÊN SÂU TỪ VỰNG LUYỆN THI VÀO 10 (Unit 1-2-3)
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

def add_header(c, page_num, section_title):
    """Add logo and header"""
    logo_path = "/home/ubuntu/.cursor/projects/workspace/assets/01a085c5-1ece-7f9b-a6f5-21f3fe32e9d2.jpg"
    try:
        c.drawImage(logo_path, 1.5*cm, 27.5*cm, width=3.5*cm, height=1.3*cm, preserveAspectRatio=True)
    except:
        pass
    
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(10.5*cm, 27.8*cm, "LUYỆN CHUYÊN SÂU TỪ VỰNG LUYỆN THI VÀO 10")
    
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(10.5*cm, 27.2*cm, "Units 1-2-3 | Global Success Grade 9 | Hanoi Entrance Exam 2025-2026")
    
    if section_title:
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(10.5*cm, 26.6*cm, section_title)
    
    c.setFont("Helvetica", 8)
    c.drawString(10.5*cm - 1*cm, 0.8*cm, f"Trang {page_num}")
    
    c.setStrokeColor(HexColor("#E8A144"))
    c.setLineWidth(1.5)
    c.line(1.5*cm, 26.1*cm, 19.5*cm, 26.1*cm)

# PART 1: 50 Single Words
part1 = [
    ("1. The local _______ makes beautiful pottery for tourists.", "A. artisan|B. artist|C. architect|D. actor", "A"),
    ("2. Public _______ in the city includes buses and trains.", "A. transport|B. transportation|C. transporting|D. transported", "B"),
    ("3. The city suffers from serious air _______.", "A. pollute|B. pollution|C. polluted|D. polluting", "B"),
    ("4. A _______ diet includes fruits and vegetables.", "A. balance|B. balanced|C. balancing|D. balances", "B"),
    ("5. They want to _______ traditional lifestyle.", "A. preserve|B. preservation|C. preservative|D. preserved", "A"),
    ("6. Traffic _______ is a major problem.", "A. congest|B. congesting|C. congestion|D. congested", "C"),
    ("7. Regular exercise improves _______ health.", "A. mental|B. mentally|C. mentality|D. mention", "A"),
    ("8. The town has a very _______ atmosphere.", "A. charm|B. charming|C. charmed|D. charms", "B"),
    ("9. Modern _______ improves quality of life.", "A. infrastruture|B. structural|C. structure|D. infrastructure", "D"),
    ("10. Getting enough _______ is essential.", "A. sleep|B. sleeping|C. sleepy|D. asleep", "A"),
    
    ("11. Living in _______ areas is expensive.", "A. urban|B. urbanize|C. urbanized|D. urbanization", "A"),
    ("12. Teenagers should avoid _______ food.", "A. junk|B. junky|C. junking|D. junked", "A"),
    ("13. The city offers excellent _______.", "A. facility|B. facilities|C. facilitate|D. facilitation", "B"),
    ("14. Good time _______ helps reduce stress.", "A. manage|B. management|C. manager|D. managing", "B"),
    ("15. The _______ community is welcoming.", "A. locate|B. location|C. local|D. locally", "C"),
    ("16. The museum displays traditional _______.", "A. handicraft|B. handicrafts|C. handcraft|D. handcrafts", "B"),
    ("17. The city center is always _______.", "A. crowd|B. crowded|C. crowding|D. crowds", "B"),
    ("18. Living in the city can be _______.", "A. stress|B. stressed|C. stressful|D. stressing", "C"),
    ("19. Fresh _______ is sold at the market.", "A. produce|B. product|C. production|D. productive", "A"),
    ("20. The _______ lifestyle is peaceful.", "A. rural|B. rurally|C. ruralize|D. ruralized", "A"),
    
    ("21. Good _______ is important.", "A. nutrient|B. nutrition|C. nutritious|D. nutritional", "B"),
    ("22. The bridge improved _______.", "A. connect|B. connection|C. connectivity|D. connected", "C"),
    ("23. Peer _______ affects teenagers.", "A. press|B. pressure|C. pressing|D. pressed", "B"),
    ("24. The _______ of the city attracts tourists.", "A. beautiful|B. beauty|C. beautifully|D. beautify", "B"),
    ("25. Traditional _______ should be passed down.", "A. culture|B. cultural|C. culturally|D. cultured", "A"),
    ("26. The hospital has modern _______.", "A. equip|B. equipment|C. equipped|D. equipping", "B"),
    ("27. Checkups maintain good _______.", "A. healthy|B. health|C. healthily|D. healthiness", "B"),
    ("28. The _______ population grows rapidly.", "A. urban|B. urbanize|C. urbanized|D. urbanization", "A"),
    ("29. Developing good _______ is important.", "A. habit|B. habits|C. habitual|D. habitually", "B"),
    ("30. The _______ area has many shops.", "A. commerce|B. commercial|C. commercially|D. commercialize", "B"),
    
    ("31. Physical _______ improves health.", "A. active|B. activity|C. activate|D. actively", "B"),
    ("32. The village has a long _______.", "A. traditional|B. tradition|C. traditionally|D. traditions", "B"),
    ("33. The city offers many _______.", "A. opportune|B. opportunity|C. opportunities|D. opportunist", "C"),
    ("34. Teenagers need enough _______.", "A. nutritious|B. nutrition|C. nutrient|D. nutritional", "B"),
    ("35. The _______ is very high.", "A. dense|B. density|C. densely|D. denseness", "B"),
    ("36. Local _______ preserve traditions.", "A. artisan|B. artisans|C. artisanal|D. artisanship", "B"),
    ("37. The city has good _______.", "A. transport|B. transportation|C. transporting|D. transported", "B"),
    ("38. Maintaining a healthy _______ is crucial.", "A. life|B. lifestyle|C. living|D. lively", "B"),
    ("39. The _______ attracts photographers.", "A. scene|B. scenery|C. scenic|D. scenically", "B"),
    ("40. The craft requires great _______.", "A. patient|B. patience|C. patiently|D. patients", "B"),
    
    ("41. Urban _______ includes roads.", "A. infrastruture|B. structure|C. structural|D. infrastructure", "D"),
    ("42. Students should _______ on studies.", "A. concentrate|B. concentration|C. concentrated|D. concentrating", "A"),
    ("43. The _______ market sells vegetables.", "A. locate|B. location|C. local|D. locally", "C"),
    ("44. Good _______ reduces disease risk.", "A. hygienic|B. hygiene|C. hygienist|D. hygienically", "B"),
    ("45. The city's _______ is diverse.", "A. populate|B. population|C. popular|D. popularity", "B"),
    ("46. Traditional _______ are dying out.", "A. craft|B. crafts|C. crafted|D. crafting", "B"),
    ("47. The _______ system helps students.", "A. educate|B. education|C. educational|D. educated", "C"),
    ("48. Exercise gives more _______.", "A. energetic|B. energy|C. energize|D. energetically", "B"),
    ("49. The village has _______ spirit.", "A. strength|B. strengthen|C. strong|D. strongly", "C"),
    ("50. The _______ are convenient.", "A. facility|B. facilities|C. facilitate|D. facilitation", "B"),
]

# PART 2: 50 Phrasal Verbs
part2 = [
    ("1. Can you _______ this word?", "A. look up|B. look after|C. look for|D. look at", "A"),
    ("2. They _______ the old buildings.", "A. pull down|B. set up|C. carry out|D. turn down", "A"),
    ("3. She _______ traditional stories.", "A. brings up|B. passes down|C. hands in|D. gives away", "B"),
    ("4. We want to _______ a new center.", "A. set up|B. turn down|C. break down|D. cut down", "A"),
    ("5. We must _______ craft villages.", "A. look after|B. run out of|C. deal with|D. get over", "A"),
    ("6. Please _______ your shoes.", "A. take off|B. put on|C. turn on|D. get off", "A"),
    ("7. The workshop will _______.", "A. take place|B. take part|C. take care|D. take after", "A"),
    ("8. Artisans want to _______ traditions.", "A. carry on|B. go on|C. turn on|D. get on", "A"),
    ("9. You should _______ smoking.", "A. give up|B. give in|C. give out|D. give away", "A"),
    ("10. I need to _______ fast food.", "A. cut down on|B. cut off|C. cut in|D. cut out", "A"),
    
    ("11. Students _______ late to study.", "A. stay up|B. get up|C. wake up|D. stand up", "A"),
    ("12. She _______ yoga for relaxation.", "A. take up|B. take off|C. take in|D. take out", "A"),
    ("13. Authorities _______ problems.", "A. deal with|B. look at|C. think about|D. talk about", "A"),
    ("14. Try to _______ fatty foods.", "A. stay away from|B. get away with|C. go away from|D. run away from", "A"),
    ("15. Students _______ stress in exams.", "A. go through|B. get through|C. come through|D. see through", "A"),
    ("16. The meeting was _______.", "A. put off|B. put on|C. put up|D. put out", "A"),
    ("17. I'm _______ to visiting.", "A. looking forward|B. looking after|C. looking for|D. looking at", "A"),
    ("18. She _______ her mother.", "A. takes after|B. takes off|C. takes up|D. takes in", "A"),
    ("19. They will _______ the project.", "A. carry out|B. carry on|C. carry off|D. carry away", "A"),
    ("20. The tradition has been _______.", "A. passed down|B. passed by|C. passed out|D. passed over", "A"),
    
    ("21. It's hard to _______ habits.", "A. break|B. make|C. take|D. shake", "A"),
    ("22. Exercise helps you _______ fit.", "A. keep|B. make|C. take|D. have", "A"),
    ("23. Don't _______ meals.", "A. skip|B. slip|C. strip|D. trip", "A"),
    ("24. The tradition is _______.", "A. dying out|B. dying down|C. dying off|D. dying away", "A"),
    ("25. We need to _______ a solution.", "A. come up with|B. come up to|C. come down with|D. come down to", "A"),
    ("26. They _______ the plan.", "A. turned down|B. turned up|C. turned on|D. turned off", "A"),
    ("27. I can't _______ the noise.", "A. put up with|B. put off|C. put on|D. put out", "A"),
    ("28. The city needs _______ spaces.", "A. set up|B. set off|C. set out|D. set in", "A"),
    ("29. Maintain a _______ attitude.", "A. positive|B. contain|C. obtain|D. sustain", "A"),
    ("30. I need to _______ information.", "A. find out|B. find in|C. find on|D. find at", "A"),
    
    ("31. The event was _______.", "A. called off|B. called on|C. called up|D. called for", "A"),
    ("32. We should _______ elders.", "A. respect|B. disrespect|C. suspect|D. prospect", "A"),
    ("33. You need to _______ priorities.", "A. sort out|B. sort in|C. sort on|D. sort at", "A"),
    ("34. The workshop _______ participants.", "A. brought together|B. brought up|C. brought in|D. brought out", "A"),
    ("35. Try to _______ with classmates.", "A. get along|B. get on|C. get by|D. get over", "A"),
    ("36. Food prices have _______.", "A. gone up|B. gone down|C. gone off|D. gone out", "A"),
    ("37. I _______ my notes.", "A. go over|B. go on|C. go off|D. go out", "A"),
    ("38. She _______ a cold.", "A. came down with|B. came up with|C. came along with|D. came out with", "A"),
    ("39. The lights _______.", "A. went out|B. went on|C. went off|D. went up", "A"),
    ("40. We need to _______ this issue.", "A. look into|B. look after|C. look for|D. look at", "A"),
    
    ("41. The teacher _______ homework.", "A. handed out|B. handed in|C. handed over|D. handed down", "A"),
    ("42. Students must _______ essays.", "A. hand in|B. hand out|C. hand over|D. hand down", "A"),
    ("43. The fire _______ quickly.", "A. spread out|B. spread in|C. spread on|D. spread at", "A"),
    ("44. We should _______ plastic use.", "A. cut down on|B. cut off|C. cut in|D. cut out", "A"),
    ("45. Doctor told him to _______ salt.", "A. cut back on|B. cut off|C. cut in|D. cut out", "A"),
    ("46. She _______ the opportunity.", "A. turned down|B. turned up|C. turned on|D. turned off", "A"),
    ("47. The business is _______.", "A. doing well|B. doing good|C. making well|D. making good", "A"),
    ("48. I _______ my old friend.", "A. ran into|B. ran out|C. ran over|D. ran off", "A"),
    ("49. Please _______ the form.", "A. fill in|B. fill out|C. fill up|D. Both A & B", "D"),
    ("50. The alarm _______ at 6 AM.", "A. went off|B. went on|C. went out|D. went up", "A"),
]

def create_workbook():
    filename = "/workspace/LUYEN_CHUYEN_SAU_TU_VUNG_Grade9_FIXED.pdf"
    c = canvas.Canvas(filename, pagesize=A4)
    page_num = 1
    
    # Draw Part 1
    section_title = "PHẦN 1: TỪ ĐƠN (50 câu)"
    for i in range(0, 50, 5):
        add_header(c, page_num, section_title)
        y = 24.5*cm
        
        for j in range(i, min(i+5, 50)):
            q_text, options, ans = part1[j]
            
            # Question
            c.setFont("Helvetica", 9)
            c.drawString(1.8*cm, y, q_text)
            y -= 0.55*cm
            
            # Options horizontal
            c.setFont("Helvetica", 8)
            opts = options.split("|")
            x_pos = [1.8*cm, 6*cm, 10.5*cm, 15*cm]
            for k, opt in enumerate(opts):
                c.drawString(x_pos[k], y, opt)
            
            y -= 0.7*cm
        
        c.showPage()
        page_num += 1
    
    # Draw Part 2
    section_title = "PHẦN 2: PHRASAL VERBS (50 câu)"
    for i in range(0, 50, 5):
        add_header(c, page_num, section_title)
        y = 24.5*cm
        
        for j in range(i, min(i+5, 50)):
            q_text, options, ans = part2[j]
            
            c.setFont("Helvetica", 9)
            c.drawString(1.8*cm, y, q_text)
            y -= 0.55*cm
            
            c.setFont("Helvetica", 8)
            opts = options.split("|")
            x_pos = [1.8*cm, 6*cm, 10.5*cm, 15*cm]
            for k, opt in enumerate(opts):
                c.drawString(x_pos[k], y, opt)
            
            y -= 0.7*cm
        
        c.showPage()
        page_num += 1
    
    # Note page for remaining parts
    add_header(c, page_num, "PHẦN 3-4-5: ĐANG CẬP NHẬT")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(3*cm, 20*cm, "📝 PHẦN 3: ĐỒNG NGHĨA & TRÁI NGHĨA (50 câu)")
    c.drawString(3*cm, 18*cm, "🔗 PHẦN 4: COLLOCATION (50 câu)")
    c.drawString(3*cm, 16*cm, "📖 PHẦN 5: BÀI ĐỌC ĐIỀN TỪ (5 bài)")
    
    c.setFont("Helvetica", 10)
    c.drawString(3*cm, 13*cm, "Nội dung đầy đủ đang được hoàn thiện...")
    c.drawString(3*cm, 12*cm, "File này hiện có 100 câu trắc nghiệm (Phần 1 + 2)")
    
    c.save()
    print(f"✅ Created: {filename}")
    print(f"📄 Pages: {page_num}")

if __name__ == "__main__":
    create_workbook()
