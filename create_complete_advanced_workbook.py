#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Complete Advanced Vocabulary Workbook Generator
LUYỆN CHUYÊN SÂU TỪ VỰNG LUYỆN THI VÀO 10 (Unit 1-2-3)
Total: 200 questions + 5 reading passages
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def add_logo_and_header(c, page_num, total_pages, section_title=""):
    """Add logo, header, and page number"""
    logo_path = "/home/ubuntu/.cursor/projects/workspace/assets/01a085c5-1ece-7f9b-a6f5-21f3fe32e9d2.jpg"
    c.drawImage(logo_path, 1.5*cm, 27.5*cm, width=3.5*cm, height=1.3*cm, preserveAspectRatio=True)
    
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(10.5*cm, 28*cm, "LUYỆN CHUYÊN SÂU TỪ VỰNG LUYỆN THI VÀO 10")
    
    c.setFont("Helvetica", 9)
    c.drawCentredString(10.5*cm, 27.4*cm, "Units 1-2-3 - Global Success Grade 9 | Hanoi Entrance Exam 2025-2026")
    
    if section_title:
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(10.5*cm, 26.7*cm, section_title)
    
    c.setFont("Helvetica", 9)
    c.drawCentredString(10.5*cm, 1*cm, f"Trang {page_num}/{total_pages}")
    
    c.setStrokeColor(HexColor("#E8A144"))
    c.setLineWidth(2)
    c.line(1.5*cm, 26.2*cm, 19.5*cm, 26.2*cm)

# Generate all question data (I'll create comprehensive lists for all parts)

def generate_part1_questions():
    """Part 1: Single Words (50 questions)"""
    return [
        ("1. The local _______ makes beautiful pottery for tourists.", 
         ["A. artisan", "B. artist", "C. architect", "D. actor"], "A"),
        ("2. Public _______ in the city includes buses, trains, and taxis.", 
         ["A. transport", "B. transportation", "C. transporting", "D. transported"], "B"),
        ("3. The city suffers from serious air _______.", 
         ["A. pollute", "B. pollution", "C. polluted", "D. polluting"], "B"),
        ("4. A _______ diet includes fruits, vegetables, and proteins.", 
         ["A. balance", "B. balanced", "C. balancing", "D. balances"], "B"),
        ("5. They want to _______ the traditional lifestyle of the village.", 
         ["A. preserve", "B. preservation", "C. preservative", "D. preserved"], "A"),
        
        ("6. Traffic _______ is a major problem during rush hours.", 
         ["A. congest", "B. congesting", "C. congestion", "D. congested"], "C"),
        ("7. Regular exercise improves both physical and _______ health.", 
         ["A. mental", "B. mentally", "C. mentality", "D. mention"], "A"),
        ("8. The old town has a very _______ atmosphere with narrow streets.", 
         ["A. charm", "B. charming", "C. charmed", "D. charms"], "B"),
        ("9. Modern _______ has improved the quality of life.", 
         ["A. infrastruture", "B. structural", "C. structure", "D. infrastructure"], "D"),
        ("10. Getting enough _______ is essential for teenagers.", 
         ["A. sleep", "B. sleeping", "C. sleepy", "D. asleep"], "A"),
        
        # Continue with 40 more questions...
        ("11. The cost of living in _______ areas is usually higher.", 
         ["A. urban", "B. urbanize", "C. urbanized", "D. urbanization"], "A"),
        ("12. Teenagers should avoid _______ food and soft drinks.", 
         ["A. junk", "B. junky", "C. junking", "D. junked"], "A"),
        ("13. The city offers excellent shopping _______.", 
         ["A. facility", "B. facilities", "C. facilitate", "D. facilitation"], "B"),
        ("14. Good time _______ helps reduce stress.", 
         ["A. manage", "B. management", "C. manager", "D. managing"], "B"),
        ("15. The _______ community welcomes visitors warmly.", 
         ["A. locate", "B. location", "C. local", "D. locally"], "C"),
        
        ("16. The museum displays traditional _______.", 
         ["A. handicraft", "B. handicrafts", "C. handcraft", "D. handcrafts"], "B"),
        ("17. The city center is always _______ with people.", 
         ["A. crowd", "B. crowded", "C. crowding", "D. crowds"], "B"),
        ("18. Living in the city can be very _______.", 
         ["A. stress", "B. stressed", "C. stressful", "D. stressing"], "C"),
        ("19. Fresh _______ is sold at the local market.", 
         ["A. produce", "B. product", "C. production", "D. productive"], "A"),
        ("20. The _______ lifestyle suits some people better.", 
         ["A. rural", "B. rurally", "C. ruralize", "D. ruralized"], "A"),
        
        ("21. Good _______ is important for healthy living.", 
         ["A. nutrient", "B. nutrition", "C. nutritious", "D. nutritional"], "B"),
        ("22. The new bridge improved _______.", 
         ["A. connect", "B. connection", "C. connectivity", "D. connected"], "C"),
        ("23. Peer _______ affects teenagers' decisions.", 
         ["A. press", "B. pressure", "C. pressing", "D. pressed"], "B"),
        ("24. The _______ of the city attracts many tourists.", 
         ["A. beautiful", "B. beauty", "C. beautifully", "D. beautify"], "B"),
        ("25. Traditional _______ should be passed to younger generations.", 
         ["A. culture", "B. cultural", "C. culturally", "D. cultured"], "A"),
        
        ("26. The hospital has modern medical _______.", 
         ["A. equip", "B. equipment", "C. equipped", "D. equipping"], "B"),
        ("27. Regular checkups help maintain good _______.", 
         ["A. healthy", "B. health", "C. healthily", "D. healthiness"], "B"),
        ("28. The _______ population is growing rapidly.", 
         ["A. urban", "B. urbanize", "C. urbanized", "D. urbanization"], "A"),
        ("29. Developing good study _______ is important.", 
         ["A. habit", "B. habits", "C. habitual", "D. habitually"], "B"),
        ("30. The _______ area has many shops and restaurants.", 
         ["A. commerce", "B. commercial", "C. commercially", "D. commercialize"], "B"),
        
        ("31. Physical _______ improves overall health.", 
         ["A. active", "B. activity", "C. activate", "D. actively"], "B"),
        ("32. The craft village has a long _______.", 
         ["A. traditional", "B. tradition", "C. traditionally", "D. traditions"], "B"),
        ("33. The city offers many job _______.", 
         ["A. opportune", "B. opportunity", "C. opportunities", "D. opportunist"], "C"),
        ("34. Teenagers need enough _______ for growth.", 
         ["A. nutritious", "B. nutrition", "C. nutrient", "D. nutritional"], "B"),
        ("35. The _______ in this neighborhood is very high.", 
         ["A. dense", "B. density", "C. densely", "D. denseness"], "B"),
        
        ("36. Local _______ help preserve traditions.", 
         ["A. artisan", "B. artisans", "C. artisanal", "D. artisanship"], "B"),
        ("37. The city has a good public _______ system.", 
         ["A. transport", "B. transportation", "C. transporting", "D. transported"], "B"),
        ("38. Maintaining a healthy _______ is crucial.", 
         ["A. life", "B. lifestyle", "C. living", "D. lively"], "B"),
        ("39. The _______ of the town attracts photographers.", 
         ["A. scene", "B. scenery", "C. scenic", "D. scenically"], "B"),
        ("40. The craft requires great skill and _______.", 
         ["A. patient", "B. patience", "C. patiently", "D. patients"], "B"),
        
        ("41. Urban _______ includes roads, bridges, and utilities.", 
         ["A. infrastruture", "B. structure", "C. structural", "D. infrastructure"], "D"),
        ("42. Students should _______ on their studies.", 
         ["A. concentrate", "B. concentration", "C. concentrated", "D. concentrating"], "A"),
        ("43. The _______ market sells fresh vegetables daily.", 
         ["A. locate", "B. location", "C. local", "D. locally"], "C"),
        ("44. Good _______ reduces the risk of disease.", 
         ["A. hygienic", "B. hygiene", "C. hygienist", "D. hygienically"], "B"),
        ("45. The city's _______ is very diverse.", 
         ["A. populate", "B. population", "C. popular", "D. popularity"], "B"),
        
        ("46. Traditional _______ are dying out.", 
         ["A. craft", "B. crafts", "C. crafted", "D. crafting"], "B"),
        ("47. The _______ system helps students learn better.", 
         ["A. educate", "B. education", "C. educational", "D. educated"], "C"),
        ("48. Regular exercise gives you more _______.", 
         ["A. energetic", "B. energy", "C. energize", "D. energetically"], "B"),
        ("49. The village has a _______ community spirit.", 
         ["A. strength", "B. strengthen", "C. strong", "D. strongly"], "C"),
        ("50. The _______ in the city is very convenient.", 
         ["A. facility", "B. facilities", "C. facilitate", "D. facilitation"], "B"),
    ]

def generate_part2_questions():
    """Part 2: Phrasal Verbs (50 questions)"""
    return [
        ("1. Can you _______ the meaning of this word in the dictionary?", 
         ["A. look up", "B. look after", "C. look for", "D. look at"], "A"),
        ("2. The government decided to _______ the old buildings.", 
         ["A. pull down", "B. set up", "C. carry out", "D. turn down"], "A"),
        ("3. My grandmother _______ traditional stories to us.", 
         ["A. brings up", "B. passes down", "C. hands in", "D. gives away"], "B"),
        ("4. They want to _______ a new community center.", 
         ["A. set up", "B. turn down", "C. break down", "D. cut down"], "A"),
        ("5. We must _______ the traditional craft villages.", 
         ["A. look after", "B. run out of", "C. deal with", "D. get over"], "A"),
        
        # Add 45 more phrasal verb questions...
        ("6. Please _______ your shoes before entering.", 
         ["A. take off", "B. put on", "C. turn on", "D. get off"], "A"),
        ("7. The workshop will _______ next Saturday.", 
         ["A. take place", "B. take part", "C. take care", "D. take after"], "A"),
        ("8. Young artisans want to _______ family traditions.", 
         ["A. carry on", "B. go on", "C. turn on", "D. get on"], "A"),
        ("9. You should _______ smoking for better health.", 
         ["A. give up", "B. give in", "C. give out", "D. give away"], "A"),
        ("10. I need to _______ eating fast food.", 
         ["A. cut down on", "B. cut off", "C. cut in", "D. cut out"], "A"),
        
        ("11. Students often _______ late to finish homework.", 
         ["A. stay up", "B. get up", "C. wake up", "D. stand up"], "A"),
        ("12. She decided to _______ yoga for relaxation.", 
         ["A. take up", "B. take off", "C. take in", "D. take out"], "A"),
        ("13. The authorities need to _______ traffic problems.", 
         ["A. deal with", "B. look at", "C. think about", "D. talk about"], "A"),
        ("14. Try to _______ fatty foods.", 
         ["A. stay away from", "B. get away with", "C. go away from", "D. run away from"], "A"),
        ("15. Many students _______ stress during exams.", 
         ["A. go through", "B. get through", "C. come through", "D. see through"], "A"),
        
        # Continue pattern for 35 more...
        ("16. The meeting was _______ until next week.", 
         ["A. put off", "B. put on", "C. put up", "D. put out"], "A"),
        ("17. I'm _______ to visiting the museum.", 
         ["A. looking forward", "B. looking after", "C. looking for", "D. looking at"], "A"),
        ("18. She _______ her mother in appearance.", 
         ["A. takes after", "B. takes off", "C. takes up", "D. takes in"], "A"),
        ("19. The company will _______ the new project.", 
         ["A. carry out", "B. carry on", "C. carry off", "D. carry away"], "A"),
        ("20. The tradition has been _______ for generations.", 
         ["A. passed down", "B. passed by", "C. passed out", "D. passed over"], "A"),
        
        ("21. It's hard to _______ bad habits.", 
         ["A. break", "B. make", "C. take", "D. shake"], "A"),
        ("22. Regular exercise helps you _______ fit.", 
         ["A. keep", "B. make", "C. take", "D. have"], "A"),
        ("23. Don't _______ meals if you want to stay healthy.", 
         ["A. skip", "B. slip", "C. strip", "D. trip"], "A"),
        ("24. The old tradition is slowly _______.", 
         ["A. dying out", "B. dying down", "C. dying off", "D. dying away"], "A"),
        ("25. We need to _______ a solution to this problem.", 
         ["A. come up with", "B. come up to", "C. come down with", "D. come down to"], "A"),
        
        ("26. They _______ the plan after careful consideration.", 
         ["A. turned down", "B. turned up", "C. turned on", "D. turned off"], "A"),
        ("27. I can't _______ the noise anymore.", 
         ["A. put up with", "B. put off", "C. put on", "D. put out"], "A"),
        ("28. The city needs to _______ more green spaces.", 
         ["A. set up", "B. set off", "C. set out", "D. set in"], "A"),
        ("29. You should _______ a positive attitude.", 
         ["A. maintain", "B. contain", "C. obtain", "D. sustain"], "A"),
        ("30. I need to _______ some information.", 
         ["A. find out", "B. find in", "C. find on", "D. find at"], "A"),
        
        ("31. The event was _______ due to bad weather.", 
         ["A. called off", "B. called on", "C. called up", "D. called for"], "A"),
        ("32. We should _______ our elders.", 
         ["A. respect", "B. disrespect", "C. suspect", "D. prospect"], "A"),
        ("33. You need to _______ your priorities.", 
         ["A. sort out", "B. sort in", "C. sort on", "D. sort at"], "A"),
        ("34. The workshop _______ all the participants.", 
         ["A. brought together", "B. brought up", "C. brought in", "D. brought out"], "A"),
        ("35. Try to _______ with your classmates.", 
         ["A. get along", "B. get on", "C. get by", "D. get over"], "A"),
        
        ("36. The price of food has _______.", 
         ["A. gone up", "B. gone down", "C. gone off", "D. gone out"], "A"),
        ("37. I need to _______ my notes before the exam.", 
         ["A. go over", "B. go on", "C. go off", "D. go out"], "A"),
        ("38. She _______ a cold last week.", 
         ["A. came down with", "B. came up with", "C. came along with", "D. came out with"], "A"),
        ("39. The lights suddenly _______.", 
         ["A. went out", "B. went on", "C. went off", "D. went up"], "A"),
        ("40. We need to _______ this issue immediately.", 
         ["A. look into", "B. look after", "C. look for", "D. look at"], "A"),
        
        ("41. The teacher _______ the homework assignment.", 
         ["A. handed out", "B. handed in", "C. handed over", "D. handed down"], "A"),
        ("42. Students must _______ their essays by Friday.", 
         ["A. hand in", "B. hand out", "C. hand over", "D. hand down"], "A"),
        ("43. The fire _______ quickly.", 
         ["A. spread out", "B. spread in", "C. spread on", "D. spread at"], "A"),
        ("44. We should _______ plastic use.", 
         ["A. cut down on", "B. cut off", "C. cut in", "D. cut out"], "A"),
        ("45. The doctor told him to _______ salt.", 
         ["A. cut back on", "B. cut off", "C. cut in", "D. cut out"], "A"),
        
        ("46. She _______ the opportunity to study abroad.", 
         ["A. turned down", "B. turned up", "C. turned on", "D. turned off"], "A"),
        ("47. The business is _______.", 
         ["A. doing well", "B. doing good", "C. making well", "D. making good"], "A"),
        ("48. I _______ my old friend yesterday.", 
         ["A. ran into", "B. ran out", "C. ran over", "D. ran off"], "A"),
        ("49. Please _______ the form carefully.", 
         ["A. fill in", "B. fill out", "C. fill up", "D. Both A & B"], "D"),
        ("50. The alarm _______ at 6 AM.", 
         ["A. went off", "B. went on", "C. went out", "D. went up"], "A"),
    ]

def generate_part3_questions():
    """Part 3: Synonyms & Antonyms (50 questions)"""
    return [
        ("1. The city is very crowded during rush hour. [CLOSEST]", 
         ["A. packed", "B. empty", "C. quiet", "D. spacious"], "A"),
        ("2. Life in the city is hectic. [OPPOSITE]", 
         ["A. calm", "B. busy", "C. rushed", "D. fast"], "A"),
        ("3. The downtown area is bustling with activity. [CLOSEST]", 
         ["A. lively", "B. peaceful", "C. boring", "D. silent"], "A"),
        ("4. The streets are always noisy. [OPPOSITE]", 
         ["A. quiet", "B. loud", "C. crowded", "D. busy"], "A"),
        ("5. The cost of living is very high. [CLOSEST]", 
         ["A. expensive", "B. cheap", "C. low", "D. reasonable"], "A"),
        
        # Add 45 more synonym/antonym questions...
        ("6. Modern buildings are everywhere. [OPPOSITE]", 
         ["A. ancient", "B. new", "C. contemporary", "D. recent"], "A"),
        ("7. Many people find city life stressful. [CLOSEST]", 
         ["A. tense", "B. relaxing", "C. comfortable", "D. easy"], "A"),
        ("8. The city centre is very polluted. [OPPOSITE]", 
         ["A. clean", "B. dirty", "C. contaminated", "D. toxic"], "A"),
        ("9. The skyscraper dominates the skyline. [CLOSEST]", 
         ["A. towers over", "B. hides from", "C. disappears", "D. looks at"], "A"),
        ("10. Housing is expensive in urban areas. [OPPOSITE]", 
         ["A. cheap", "B. costly", "C. valuable", "D. high"], "A"),
        
        ("11. Public transport is efficient. [CLOSEST]", 
         ["A. effective", "B. slow", "C. useless", "D. poor"], "A"),
        ("12. The population density is high. [OPPOSITE]", 
         ["A. low", "B. tall", "C. elevated", "D. raised"], "A"),
        ("13. The urban sprawl is expanding rapidly. [CLOSEST]", 
         ["A. growing", "B. shrinking", "C. stopping", "D. reducing"], "A"),
        ("14. The city offers abundant opportunities. [OPPOSITE]", 
         ["A. scarce", "B. plenty", "C. many", "D. numerous"], "A"),
        ("15. The city offers diverse entertainment. [CLOSEST]", 
         ["A. varied", "B. limited", "C. similar", "D. boring"], "A"),
        
        ("16. Traffic moves slowly during rush hour. [OPPOSITE]", 
         ["A. quickly", "B. gradually", "C. steadily", "D. carefully"], "A"),
        ("17. Traffic congestion is a major problem. [CLOSEST]", 
         ["A. serious", "B. minor", "C. small", "D. unimportant"], "A"),
        ("18. The neighbourhood is very safe. [OPPOSITE]", 
         ["A. dangerous", "B. secure", "C. protected", "D. guarded"], "A"),
        ("19. The city has excellent facilities. [CLOSEST]", 
         ["A. outstanding", "B. poor", "C. terrible", "D. bad"], "A"),
        ("20. Public spaces are well-maintained. [OPPOSITE]", 
         ["A. neglected", "B. cared for", "C. preserved", "D. kept"], "A"),
        
        ("21. The atmosphere is peaceful. [CLOSEST]", 
         ["A. tranquil", "B. noisy", "C. chaotic", "D. disturbed"], "A"),
        ("22. The village is remote. [OPPOSITE]", 
         ["A. accessible", "B. distant", "C. far", "D. isolated"], "A"),
        ("23. Traditional crafts are valuable. [CLOSEST]", 
         ["A. precious", "B. worthless", "C. cheap", "D. common"], "A"),
        ("24. The market is vibrant. [OPPOSITE]", 
         ["A. dull", "B. lively", "C. energetic", "D. active"], "A"),
        ("25. The community is welcoming. [CLOSEST]", 
         ["A. friendly", "B. hostile", "C. cold", "D. unwelcoming"], "A"),
        
        ("26. The area is prosperous. [OPPOSITE]", 
         ["A. poor", "B. wealthy", "C. rich", "D. affluent"], "A"),
        ("27. The lifestyle is simple. [CLOSEST]", 
         ["A. uncomplicated", "B. complex", "C. difficult", "D. hard"], "A"),
        ("28. The food is nutritious. [OPPOSITE]", 
         ["A. unhealthy", "B. healthy", "C. beneficial", "D. good"], "A"),
        ("29. Regular exercise is beneficial. [CLOSEST]", 
         ["A. helpful", "B. harmful", "C. useless", "D. bad"], "A"),
        ("30. A balanced diet is essential. [OPPOSITE]", 
         ["A. unnecessary", "B. important", "C. crucial", "D. vital"], "A"),
        
        ("31. Teenagers are energetic. [CLOSEST]", 
         ["A. active", "B. lazy", "C. tired", "D. weak"], "A"),
        ("32. Junk food is harmful. [OPPOSITE]", 
         ["A. beneficial", "B. bad", "C. dangerous", "D. toxic"], "A"),
        ("33. The habit is positive. [CLOSEST]", 
         ["A. good", "B. negative", "C. bad", "D. harmful"], "A"),
        ("34. Stress levels are increasing. [OPPOSITE]", 
         ["A. decreasing", "B. rising", "C. growing", "D. mounting"], "A"),
        ("35. The environment is polluted. [CLOSEST]", 
         ["A. contaminated", "B. clean", "C. pure", "D. fresh"], "A"),
        
        ("36. The solution is simple. [OPPOSITE]", 
         ["A. complicated", "B. easy", "C. straightforward", "D. basic"], "A"),
        ("37. The problem is urgent. [CLOSEST]", 
         ["A. pressing", "B. unimportant", "C. trivial", "D. minor"], "A"),
        ("38. The situation is improving. [OPPOSITE]", 
         ["A. worsening", "B. bettering", "C. advancing", "D. progressing"], "A"),
        ("39. The plan is practical. [CLOSEST]", 
         ["A. realistic", "B. impractical", "C. impossible", "D. unrealistic"], "A"),
        ("40. The decision is wise. [OPPOSITE]", 
         ["A. foolish", "B. smart", "C. clever", "D. intelligent"], "A"),
        
        ("41. The tradition is ancient. [CLOSEST]", 
         ["A. old", "B. modern", "C. new", "D. recent"], "A"),
        ("42. The method is effective. [OPPOSITE]", 
         ["A. ineffective", "B. efficient", "C. useful", "D. successful"], "A"),
        ("43. The result is positive. [CLOSEST]", 
         ["A. favorable", "B. negative", "C. bad", "D. poor"], "A"),
        ("44. The approach is innovative. [OPPOSITE]", 
         ["A. traditional", "B. creative", "C. original", "D. novel"], "A"),
        ("45. The impact is significant. [CLOSEST]", 
         ["A. considerable", "B. insignificant", "C. minor", "D. small"], "A"),
        
        ("46. The change is gradual. [OPPOSITE]", 
         ["A. sudden", "B. slow", "C. steady", "D. progressive"], "A"),
        ("47. The progress is remarkable. [CLOSEST]", 
         ["A. notable", "B. ordinary", "C. common", "D. usual"], "A"),
        ("48. The effort is worthwhile. [OPPOSITE]", 
         ["A. pointless", "B. valuable", "C. meaningful", "D. useful"], "A"),
        ("49. The opportunity is unique. [CLOSEST]", 
         ["A. rare", "B. common", "C. ordinary", "D. usual"], "A"),
        ("50. The experience is memorable. [OPPOSITE]", 
         ["A. forgettable", "B. unforgettable", "C. remarkable", "D. notable"], "A"),
    ]

def generate_part4_questions():
    """Part 4: Collocations (50 questions)"""
    return [
        ("1. You should _______ attention in class.", 
         ["A. pay", "B. make", "C. do", "D. take"], "A"),
        ("2. The ceremony will _______ place tomorrow.", 
         ["A. take", "B. make", "C. do", "D. have"], "A"),
        ("3. I need to _______ a decision soon.", 
         ["A. make", "B. do", "C. take", "D. have"], "A"),
        ("4. She _______ a lot of effort into her work.", 
         ["A. puts", "B. makes", "C. does", "D. takes"], "A"),
        ("5. We must _______ care of the environment.", 
         ["A. take", "B. make", "C. do", "D. have"], "A"),
        
        # Add 45 more collocation questions...
        ("6. They _______ business together.", 
         ["A. do", "B. make", "C. take", "D. have"], "A"),
        ("7. She _______ a good impression on everyone.", 
         ["A. makes", "B. does", "C. takes", "D. has"], "A"),
        ("8. You should _______ advantage of this opportunity.", 
         ["A. take", "B. make", "C. do", "D. have"], "A"),
        ("9. The teacher _______ a question to the class.", 
         ["A. raised", "B. rose", "C. rise", "D. risen"], "A"),
        ("10. We need to _______ a solution.", 
         ["A. find", "B. make", "C. do", "D. take"], "A"),
        
        ("11. Students must _______ their homework regularly.", 
         ["A. do", "B. make", "C. take", "D. have"], "A"),
        ("12. She _______ a deep breath before speaking.", 
         ["A. took", "B. made", "C. did", "D. had"], "A"),
        ("13. The company _______ a profit last year.", 
         ["A. made", "B. did", "C. took", "D. had"], "A"),
        ("14. You should _______ your best.", 
         ["A. do", "B. make", "C. take", "D. have"], "A"),
        ("15. They _______ a meeting every Monday.", 
         ["A. have", "B. make", "C. do", "D. take"], "A"),
        
        ("16. I need to _______ some research.", 
         ["A. do", "B. make", "C. take", "D. have"], "A"),
        ("17. She _______ progress in her studies.", 
         ["A. makes", "B. does", "C. takes", "D. has"], "A"),
        ("18. We should _______ action immediately.", 
         ["A. take", "B. make", "C. do", "D. have"], "A"),
        ("19. He _______ a promise to help.", 
         ["A. made", "B. did", "C. took", "D. had"], "A"),
        ("20. The event _______ place last week.", 
         ["A. took", "B. made", "C. did", "D. had"], "A"),
        
        ("21. Students should _______ notes during lectures.", 
         ["A. take", "B. make", "C. do", "D. have"], "A"),
        ("22. She _______ a mistake in her calculation.", 
         ["A. made", "B. did", "C. took", "D. had"], "A"),
        ("23. You need to _______ time to relax.", 
         ["A. take", "B. make", "C. do", "D. have"], "A"),
        ("24. They _______ fun at the party.", 
         ["A. had", "B. made", "C. did", "D. took"], "A"),
        ("25. The teacher _______ a good example.", 
         ["A. set", "B. made", "C. did", "D. took"], "A"),
        
        ("26. We must _______ responsibility for our actions.", 
         ["A. take", "B. make", "C. do", "D. have"], "A"),
        ("27. She _______ an effort to improve.", 
         ["A. made", "B. did", "C. took", "D. had"], "A"),
        ("28. You should _______ a break.", 
         ["A. take", "B. make", "C. do", "D. have"], "A"),
        ("29. The company _______ changes to policy.", 
         ["A. made", "B. did", "C. took", "D. had"], "A"),
        ("30. They _______ a conversation about health.", 
         ["A. had", "B. made", "C. did", "D. took"], "A"),
        
        ("31. Students must _______ exams seriously.", 
         ["A. take", "B. make", "C. do", "D. have"], "A"),
        ("32. She _______ a phone call.", 
         ["A. made", "B. did", "C. took", "D. had"], "A"),
        ("33. You should _______ exercise regularly.", 
         ["A. do", "B. make", "C. take", "D. have"], "A"),
        ("34. The plan _______ sense.", 
         ["A. makes", "B. does", "C. takes", "D. has"], "A"),
        ("35. We need to _______ sure everything is ready.", 
         ["A. make", "B. do", "C. take", "D. have"], "A"),
        
        ("36. He _______ a bath every morning.", 
         ["A. takes", "B. makes", "C. does", "D. has"], "A"),
        ("37. The teacher _______ lessons interesting.", 
         ["A. makes", "B. does", "C. takes", "D. has"], "A"),
        ("38. Students should _______ part in activities.", 
         ["A. take", "B. make", "C. do", "D. have"], "A"),
        ("39. She _______ a living as a teacher.", 
         ["A. makes", "B. does", "C. takes", "D. has"], "A"),
        ("40. You need to _______ a choice.", 
         ["A. make", "B. do", "C. take", "D. have"], "A"),
        
        ("41. They _______ trouble with the project.", 
         ["A. had", "B. made", "C. did", "D. took"], "A"),
        ("42. The news _______ her happy.", 
         ["A. made", "B. did", "C. took", "D. had"], "A"),
        ("43. We should _______ friends with everyone.", 
         ["A. make", "B. do", "C. take", "D. have"], "A"),
        ("44. He _______ damage to the car.", 
         ["A. did", "B. made", "C. took", "D. had"], "A"),
        ("45. Students must _______ their assignments on time.", 
         ["A. hand in", "B. hand out", "C. hand over", "D. hand down"], "A"),
        
        ("46. The teacher _______ an example on the board.", 
         ["A. gave", "B. made", "C. did", "D. took"], "A"),
        ("47. You should _______ account of all factors.", 
         ["A. take", "B. make", "C. do", "D. have"], "A"),
        ("48. They _______ a contribution to society.", 
         ["A. make", "B. do", "C. take", "D. have"], "A"),
        ("49. She _______ an appointment with the doctor.", 
         ["A. made", "B. did", "C. took", "D. had"], "A"),
        ("50. We need to _______ preparations for the exam.", 
         ["A. make", "B. do", "C. take", "D. have"], "A"),
    ]

def generate_part5_readings():
    """Part 5: Reading Cloze Tests (5 passages)"""
    return [
        {
            "title": "Reading 1: Traditional Craft Villages",
            "passage": """
Traditional craft villages in Vietnam have a long history of producing beautiful (1) _______. 
These villages, often located in (2) _______ areas, have preserved their cultural heritage 
for many generations. Local (3) _______ pass down their skills to younger family members, 
ensuring that traditional (4) _______ continue to thrive. Many tourists visit these villages 
to buy authentic (5) _______ and learn about Vietnamese culture. The government is making 
efforts to (6) _______ these valuable traditions and support local craftspeople. Modern 
(7) _______ has brought some changes, but the villages maintain their unique character 
and charm. Visitors can (8) _______ place in workshops to learn pottery, weaving, or other 
traditional skills. The (9) _______ atmosphere of these villages offers a peaceful escape 
from busy city life. These craft villages play an important role in keeping Vietnamese 
(10) _______ alive for future generations.
""",
            "questions": [
                ("1.", ["A. products", "B. handicrafts", "C. items", "D. goods"], "B"),
                ("2.", ["A. urban", "B. city", "C. rural", "D. town"], "C"),
                ("3.", ["A. artisans", "B. artists", "C. workers", "D. people"], "A"),
                ("4.", ["A. crafts", "B. skills", "C. methods", "D. ways"], "A"),
                ("5.", ["A. souvenirs", "B. gifts", "C. products", "D. items"], "A"),
                ("6.", ["A. keep", "B. preserve", "C. save", "D. maintain"], "B"),
                ("7.", ["A. life", "B. living", "C. lifestyle", "D. infrastructure"], "D"),
                ("8.", ["A. take", "B. join", "C. participate", "D. attend"], "A"),
                ("9.", ["A. peace", "B. peaceful", "C. peacefully", "D. peacefulness"], "B"),
                ("10.", ["A. culture", "B. tradition", "C. heritage", "D. customs"], "C"),
            ]
        },
        {
            "title": "Reading 2: City Life Challenges",
            "passage": """
Living in a big city offers many opportunities but also presents several (1) _______. 
Traffic (2) _______ is one of the biggest problems that urban residents face daily. 
During rush hours, the streets become extremely (3) _______, and people waste hours 
commuting to work. Air (4) _______ is another serious concern that affects people's 
health. The high (5) _______ of living makes it difficult for young people to afford 
housing in central areas. Despite these challenges, cities continue to attract people 
because of better job (6) _______ and modern (7) _______. City planners are working 
to improve public (8) _______ systems and reduce traffic problems. Many cities are 
also investing in green spaces to combat pollution. The (9) _______ population in 
cities is expected to keep growing, so finding sustainable solutions is (10) _______.
""",
            "questions": [
                ("1.", ["A. challenges", "B. difficulties", "C. problems", "D. issues"], "A"),
                ("2.", ["A. jam", "B. congestion", "C. crowd", "D. block"], "B"),
                ("3.", ["A. crowd", "B. crowding", "C. crowded", "D. crowds"], "C"),
                ("4.", ["A. pollute", "B. polluted", "C. pollution", "D. polluting"], "C"),
                ("5.", ["A. price", "B. cost", "C. expense", "D. charge"], "B"),
                ("6.", ["A. opportunity", "B. opportunities", "C. chance", "D. chances"], "B"),
                ("7.", ["A. facilities", "B. facility", "C. equipment", "D. amenities"], "A"),
                ("8.", ["A. transport", "B. transportation", "C. transporting", "D. transported"], "B"),
                ("9.", ["A. urban", "B. city", "C. town", "D. metropolitan"], "A"),
                ("10.", ["A. important", "B. essential", "C. necessary", "D. crucial"], "B"),
            ]
        },
        {
            "title": "Reading 3: Healthy Living for Teenagers",
            "passage": """
Teenagers today face many pressures and need to maintain a (1) _______ lifestyle. 
A balanced (2) _______ is fundamental to good health, including plenty of fruits, 
vegetables, and whole grains. Regular physical (3) _______ helps reduce stress and 
improve both physical and (4) _______ health. Getting enough (5) _______ is also 
crucial for teenagers' growth and development. Many teenagers skip (6) _______, 
which can negatively affect their concentration at school. Peer (7) _______ often 
influences teenagers' decisions about eating and exercise habits. It's important to 
(8) _______ away from junk food and soft drinks. Students should also learn good 
time (9) _______ to balance schoolwork and leisure activities. Developing healthy 
habits during teenage years sets the foundation for lifelong (10) _______.
""",
            "questions": [
                ("1.", ["A. health", "B. healthy", "C. healthily", "D. healthiness"], "B"),
                ("2.", ["A. food", "B. meal", "C. diet", "D. nutrition"], "C"),
                ("3.", ["A. active", "B. activity", "C. action", "D. act"], "B"),
                ("4.", ["A. mind", "B. mental", "C. mentality", "D. mentally"], "B"),
                ("5.", ["A. sleep", "B. sleeping", "C. sleepy", "D. asleep"], "A"),
                ("6.", ["A. breakfast", "B. lunch", "C. dinner", "D. meals"], "D"),
                ("7.", ["A. press", "B. pressure", "C. pressing", "D. pressed"], "B"),
                ("8.", ["A. keep", "B. stay", "C. remain", "D. maintain"], "B"),
                ("9.", ["A. manage", "B. manager", "C. management", "D. managing"], "C"),
                ("10.", ["A. health", "B. well-being", "C. wellness", "D. fitness"], "B"),
            ]
        },
        {
            "title": "Reading 4: Community Development",
            "passage": """
Local (1) _______ play a vital role in creating strong neighborhoods. Community 
centres provide (2) _______ for people of all ages to gather and participate in 
activities. These centers often organize workshops where residents can learn new 
skills or practice traditional (3) _______. Volunteers help (4) _______ care of 
public spaces and organize events that bring people together. The sense of belonging 
in a close-knit community improves residents' quality of life. Many communities are 
working to (5) _______ their local heritage and pass it down to future generations. 
Local markets serve as important social spaces where people can (6) _______ fresh 
produce and interact with neighbors. Community gardens have become popular, allowing 
residents to grow their own vegetables. These initiatives help create (7) _______ 
environments and strengthen social bonds. Strong communities are built on cooperation 
and mutual (8) _______. When residents work together, they can (9) _______ with 
challenges more effectively. Investing in community development creates lasting 
benefits for (10) _______ and future generations.
""",
            "questions": [
                ("1.", ["A. community", "B. communities", "C. commune", "D. communal"], "B"),
                ("2.", ["A. facility", "B. facilities", "C. equipment", "D. amenities"], "B"),
                ("3.", ["A. craft", "B. crafts", "C. skill", "D. skills"], "B"),
                ("4.", ["A. take", "B. make", "C. do", "D. have"], "A"),
                ("5.", ["A. keep", "B. preserve", "C. save", "D. protect"], "B"),
                ("6.", ["A. buy", "B. purchase", "C. get", "D. obtain"], "A"),
                ("7.", ["A. sustain", "B. sustainable", "C. sustainability", "D. sustaining"], "B"),
                ("8.", ["A. respect", "B. respecting", "C. respected", "D. respectful"], "A"),
                ("9.", ["A. deal", "B. cope", "C. handle", "D. manage"], "A"),
                ("10.", ["A. present", "B. current", "C. now", "D. today"], "B"),
            ]
        },
        {
            "title": "Reading 5: Urban vs Rural Living",
            "passage": """
The choice between (1) _______ and rural living depends on personal preferences and 
priorities. City life offers better job (2) _______ and access to modern facilities, 
but it can be (3) _______ and expensive. Urban areas provide excellent educational 
and healthcare (4) _______, attracting many young people. However, the fast pace 
and high cost of living can be overwhelming. (5) _______ areas offer a peaceful 
environment and closer connection to nature. The (6) _______ atmosphere in villages 
appeals to those seeking a simpler lifestyle. Traditional (7) _______ are often better 
preserved in rural communities. However, limited job prospects cause many young people 
to (8) _______ to cities. Public (9) _______ in rural areas is often less developed 
than in cities. Both lifestyles have advantages and disadvantages, and the best choice 
varies for each individual. Some people find a balance by living in suburbs that offer 
aspects of both urban and rural life. As society develops, the differences between 
urban and rural areas are gradually (10) _______.
""",
            "questions": [
                ("1.", ["A. city", "B. town", "C. urban", "D. metropolitan"], "C"),
                ("2.", ["A. opportunity", "B. opportunities", "C. chance", "D. chances"], "B"),
                ("3.", ["A. stress", "B. stressed", "C. stressful", "D. stressing"], "C"),
                ("4.", ["A. service", "B. services", "C. facility", "D. facilities"], "D"),
                ("5.", ["A. Country", "B. Countryside", "C. Rural", "D. Village"], "C"),
                ("6.", ["A. peace", "B. peaceful", "C. peacefully", "D. peacefulness"], "B"),
                ("7.", ["A. culture", "B. cultures", "C. cultural", "D. culturally"], "B"),
                ("8.", ["A. move", "B. transfer", "C. relocate", "D. migrate"], "D"),
                ("9.", ["A. transport", "B. transportation", "C. transporting", "D. transported"], "B"),
                ("10.", ["A. decrease", "B. reducing", "C. declining", "D. disappearing"], "D"),
            ]
        },
    ]

def create_complete_workbook():
    """Create the complete advanced workbook"""
    filename = "/workspace/LUYEN_CHUYEN_SAU_TU_VUNG_Grade9.pdf"
    c = canvas.Canvas(filename, pagesize=A4)
    
    # Calculate approximate total pages
    # Part 1: 50q / 5 per page = 10 pages
    # Part 2: 50q / 5 per page = 10 pages  
    # Part 3: 50q / 5 per page = 10 pages
    # Part 4: 50q / 5 per page = 10 pages
    # Part 5: 5 readings = 5 pages
    total_pages = 45
    
    page_num = 1
    questions_per_page = 5
    
    # Helper function to draw questions
    def draw_questions(questions_list, section_title):
        nonlocal page_num
        for i in range(0, len(questions_list), questions_per_page):
            add_logo_and_header(c, page_num, total_pages, section_title)
            y_position = 25*cm
            
            for question, options, answer in questions_list[i:i+questions_per_page]:
                if y_position < 4*cm:
                    c.showPage()
                    page_num += 1
                    add_logo_and_header(c, page_num, total_pages, section_title)
                    y_position = 25*cm
                
                # Question
                c.setFont("Helvetica", 9.5)
                c.drawString(1.8*cm, y_position, question)
                y_position -= 0.55*cm
                
                # Options in horizontal layout
                c.setFont("Helvetica", 8.5)
                x_positions = [1.8*cm, 6.3*cm, 10.8*cm, 15.3*cm]
                for k, option in enumerate(options):
                    c.drawString(x_positions[k], y_position, option)
                
                y_position -= 0.75*cm
            
            c.showPage()
            page_num += 1
    
    # Generate and draw all parts
    print("Generating Part 1: Single Words...")
    part1 = generate_part1_questions()
    draw_questions(part1, "PHẦN 1: TỪ ĐƠN (50 câu)")
    
    print("Generating Part 2: Phrasal Verbs...")
    part2 = generate_part2_questions()
    draw_questions(part2, "PHẦN 2: PHRASAL VERBS (50 câu)")
    
    print("Generating Part 3: Synonyms & Antonyms...")
    part3 = generate_part3_questions()
    draw_questions(part3, "PHẦN 3: ĐỒNG NGHĨA & TRÁI NGHĨA (50 câu)")
    
    print("Generating Part 4: Collocations...")
    part4 = generate_part4_questions()
    draw_questions(part4, "PHẦN 4: COLLOCATION (50 câu)")
    
    print("Generating Part 5: Reading Cloze Tests...")
    part5_readings = generate_part5_readings()
    for reading in part5_readings:
        add_logo_and_header(c, page_num, total_pages, "PHẦN 5: BÀI ĐỌC ĐIỀN TỪ")
        
        # Title
        c.setFont("Helvetica-Bold", 11)
        c.drawString(1.8*cm, 24.5*cm, reading["title"])
        
        # Passage
        c.setFont("Helvetica", 9)
        y_pos = 23.5*cm
        lines = reading["passage"].strip().split('\n')
        for line in lines:
            if line.strip():
                c.drawString(1.8*cm, y_pos, line.strip())
                y_pos -= 0.4*cm
        
        # Questions
        y_pos -= 0.3*cm
        for q_text, options, answer in reading["questions"]:
            c.setFont("Helvetica", 9)
            c.drawString(1.8*cm, y_pos, q_text)
            y_pos -= 0.5*cm
            
            c.setFont("Helvetica", 8.5)
            x_positions = [2*cm, 6.5*cm, 11*cm, 15.5*cm]
            for k, option in enumerate(options):
                c.drawString(x_positions[k], y_pos, option)
            y_pos -= 0.6*cm
        
        c.showPage()
        page_num += 1
    
    c.save()
    print(f"\n✅ Workbook created successfully!")
    print(f"📄 Filename: {filename}")
    print(f"📊 Total pages: {page_num - 1}")
    print(f"📝 Total questions: 200 + 50 (reading)")

if __name__ == "__main__":
    create_complete_workbook()
