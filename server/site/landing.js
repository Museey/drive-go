// DriveGo's landing page (/, server/site/index.html): the team's design of 2026-11-17, updated 2026-11-18 (dark, amber;
// built by tools/landing-from-design.py), the owner's choices of 2026-11-17: Thai and English (no Chinese), what the
// system does not do yet tagged "เร็ว ๆ นี้" (a text ending in §); of 2026-11-18: the design's own pages (Test Drive,
// articles, privacy policy at /testdrive, /articles, /privacy), and the demo request summed up for the visitor to copy,
// send by e-mail or on LINE (nothing is stored).
// The page's Content-Security-Policy allows no inline styles: the mock screens' sizes go in data-css and are set
// through CSSOM (applyCss). Everything here is the page's own text; nothing typed by a visitor is put in as HTML.
(() => {
/* ============ Dictionary: TH / EN ============ */
const I={
th:{
 soon:'เร็ว ๆ นี้',
 nav:{eco:'ระบบนิเวศ',plans:'แพ็กเกจ',art:'บทความน่ารู้',login:'เข้าระบบ',show:'หน้าจอจริง',cloud:'Cloud และอุปกรณ์',contact:'ติดต่อ',cta:'ทดลองใช้งานฟรี'},
 hero:{eyebrow:'ระบบบริหารอู่และศูนย์บริการรถยนต์บน Cloud',h:'ข้อมูลเพื่อการจัดการที่ดี <em>นำสู่ความสำเร็จ</em>',
  p:{l1:'ระบบบริหารอู่ซ่อมรถยนต์และศูนย์บริการ แบบครบวงจรบน Cloud',l2:'สำหรับผู้บริหารที่ต้องการ<em>ข้อมูลเพื่อการบริหารและตัดสินใจ</em>',k:['ตัวเลขการเงิน','สต๊อก','ควบคุมได้ทุกขั้นตอน']},
  pil:[['ครอบคลุมทุกการจัดการ','หน้าลาน สต๊อก บัญชี และลูกค้า ครบใน 8 โมดูล'],['บริหารได้ละเอียด','กำไรขาดทุนรายคัน รายวัน และรายสาขา§'],['ปลอดภัยด้วยระบบอนุมัติสิทธิ์','กำหนดสิทธิ์ตามตำแหน่ง อนุมัติก่อนทุกรายการสำคัญ'],['สร้างระบบนิเวศน์ที่ดี','เชื่อมลูกค้า ซัพพลายเออร์ ประกันภัย และสาขา§']],
  cta1:'นัดดู Demo ระบบ',cta2:'ดู 8 โมดูล',f1:'โมดูลในระบบเดียว',f3:'อุปกรณ์ PC Tablet Mobile',
  fl1a:'ออก Coin ให้ลูกค้าแล้ว§',fl1b:'+12 Coin จากใบเสร็จ RC-6908-001',fl2a:'ถึงจุดสั่งซื้อ',fl2b:'กรองแอร์ (EV) เหลือ 8 ชิ้น เปิด PO-001 ให้แล้ว§',note:'ตัวเลขและชื่อในหน้าจอเป็นข้อมูลตัวอย่าง'},
 eco:{eyebrow:'All-in-One Ecosystem',h:'8 โมดูล เชื่อมกันเป็นระบบเดียว',p:'เลือกโมดูลเพื่อดูหน้าจอการทำงาน ข้อมูลไหลต่อกันตั้งแต่ใบเสนอราคาจนถึงงบการเงิน'},
 mods:[
  {t:'Marketing & CRM',s:'การตลาดและลูกค้าสัมพันธ์',d:'ฐานลูกค้าผูกกับทะเบียนรถ ระบบคำนวณวันเช็กระยะ ต่อภาษี และต่อประกันจากเลขไมล์ที่ใช้จริง แล้วแจ้งเตือนให้อัตโนมัติ§',b:['สมาชิกและ DriveGo Coins สะสมจากใบเสร็จที่ชำระแล้ว§','แจ้งเตือนเช็กระยะล่วงหน้าตามระยะทางเฉลี่ยต่อวัน§','โปรโมชันและคูปองดึงลูกค้าเก่ากลับมาใช้บริการ§']},
  {t:'Workshop & Bay Management',s:'การบริหารหน้าลาน',d:'กระดานคิวซ่อมอัปเดตทันทีเมื่อสถานะเปลี่ยน เห็นว่ารถคันไหนอยู่ขั้นตอนใด และช่างคนไหนรับผิดชอบ§',b:['คิวจากแอปจอง หน้าร้าน และใบเสนอราคา รวมในกระดานเดียว§','มอบหมายงานให้ช่าง เห็นภาระงานรายคน§','ปิดงานแล้วออกใบเสร็จและตัดสต๊อกต่อทันที']},
  {t:'Inventory & Parts Stock',s:'การบริหารสต๊อกอะไหล่',d:'ทะเบียนอะไหล่พร้อมระดับ Min และ Max ตัดสต๊อกเมื่ออนุมัติซ่อม และเปิดใบขอซื้อให้เองเมื่อถึงจุดสั่งซื้อ§',b:['ตัดสต๊อกอัตโนมัติจากใบสั่งซ่อมและบิลขาย','แจ้งเตือนจุดสั่งซื้อ สต๊อกเกิน และ Dead stock','รหัสสินค้าและบาร์โค้ดสำหรับรับเข้า เบิก และตรวจนับ§']},
  {t:'Accounting & Finance',s:'บัญชีและการเงิน',d:'เอกสารขายต่อเนื่องจากใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ ถึงใบกำกับภาษี ลงบัญชีและสรุปภาษีให้ทุกงวด',b:['ลูกหนี้ เจ้าหนี้ และสถานะเงินสดในหน้าเดียว','รายงานภาษีขาย ภาษีซื้อ และภาษีหัก ณ ที่จ่าย','กำไรขาดทุนรายคัน รายวัน และงบการเงินรายปี§']},
  {t:'E-Document Approval',s:'ระบบอนุมัติเอกสาร',d:'ใบสั่งซื้อ ใบเบิกอะไหล่ และส่วนลด ส่งขออนุมัติถึงผู้มีสิทธิ์ กดอนุมัติจากมือถือได้โดยไม่ต้องรอเข้าอู่',b:['กระดิ่งแจ้งเอกสารรออนุมัติตามสิทธิ์ผู้ใช้','เห็นยอดเงิน ผู้ขอ และเหตุผลก่อนตัดสินใจ','บันทึกผู้อนุมัติและเวลาไว้ตรวจย้อนหลัง']},
  {t:'After-Sales Service',s:'บริการหลังการขาย',d:'ประวัติซ่อมรายคันเก็บต่อเนื่องทุกครั้งที่เข้าบริการ พร้อมระยะรับประกันงานซ่อมและแบบประเมินหลังรับรถ§',b:['Service History ค้นได้ด้วยทะเบียนรถ','นัดตรวจเช็กตามระยะรับประกันงานซ่อม','คะแนนและรีวิวจากลูกค้าหลังปิดงาน§']},
  {t:'Multi-Branch & Franchise',s:'รองรับแฟรนไชส์และสาขา',d:'ผู้บริหารเห็นทุกสาขาจากศูนย์กลาง เปรียบเทียบยอดขาย และโอนอะไหล่ระหว่างสาขาเมื่อสาขาใดขาดของ',b:['แดชบอร์ดรวมและแยกรายสาขา','โอนย้ายอะไหล่ระหว่างสาขาพร้อมเอกสาร','ราคาและสิทธิ์ผู้ใช้ชุดเดียวกันทั้งเครือ']},
  {t:'Business Network & Cloud',s:'เครือข่ายธุรกิจบน Cloud',d:'เชื่อมอู่กับซัพพลายเออร์อะไหล่ บริษัทประกัน และแอปผู้ใช้รถ ทำงานผ่านเบราว์เซอร์ได้ทุกอุปกรณ์§',b:['สั่งอะไหล่จากคลังกลางในราคาตรงจากซัพพลาย§','รับงานจอง ขอราคา และงานฉุกเฉินจากแอปผู้ใช้รถ§','PC, Tablet และ Mobile ใช้ข้อมูลชุดเดียวกัน']}],
 show:{eyebrow:'Interactive Showcase',h:'เจาะลึกหน้าจอ ตามบทบาทของคนในอู่',p:'กดจุดสีอำพันบนหน้าจอ หรือกดรายการด้านข้าง เพื่อดูคำอธิบายแต่ละส่วน',td:'Test Drive ดูภาพหน้าจอจริงทั้ง 58 หน้าจอ'},
 roles:[
  {t:'เจ้าของอู่',d:'ภาพรวมธุรกิจ',hs:[{t:'ตัวเลขธุรกิจ 4 ช่อง',d:'รายได้ รายจ่าย กำไรสุทธิ และลูกหนี้ค้างชำระ สลับดูรายเดือน ไตรมาส หรือ 12 เดือน'},{t:'รายได้เทียบรายจ่าย',d:'กราฟรายเดือนคำนวณจากใบเสร็จและรายจ่ายที่บันทึกในระบบ ไม่ต้องรวมตัวเลขเอง'},{t:'อายุลูกหนี้',d:'แยกยอดค้างตามจำนวนวัน เห็นทันทีว่าบิลใดควรตามเก็บก่อน'}]},
  {t:'หัวหน้าช่างหน้าลาน',d:'กระดานคิวซ่อม§',hs:[{t:'สถานะงานรายคัน',d:'แถบสีบอกขั้นตอน ตั้งแต่รอรับงาน กำลังซ่อม รอชำระ จนถึงชำระแล้ว'},{t:'อะไหล่ที่จะตัดสต๊อก',d:'ระบบแสดงอะไหล่ที่ผูกกับงานไว้ล่วงหน้า ปิดงานแล้วตัดสต๊อกให้เอง'},{t:'มอบหมายช่าง§',d:'เลือกช่างตามความถนัด ชื่อช่างขึ้นบนการ์ดงานและนับเป็นปริมาณงานสะสม'}]},
  {t:'ฝ่ายบัญชี',d:'บิลและภาษี',hs:[{t:'ทะเบียนใบเสร็จ',d:'ค้นด้วยเลขเอกสาร ทะเบียนรถ หรือรายการ และกดรับชำระได้จากแถวเดียวกัน'},{t:'สถานะและอายุหนี้',d:'ป้ายสีแยกชำระแล้วกับรอชำระ พร้อมจำนวนวันที่ค้าง'},{t:'สรุปภาษีประจำงวด',d:'ระบบประมาณการภาษีขายจากใบเสร็จที่รับชำระแล้ว พร้อมกำหนดยื่น ภ.พ.30'}]}],
 dev:{eyebrow:'Multi-Device & Cloud',h:'หน้าร้าน หน้าลาน และผู้บริหาร เห็นข้อมูลชุดเดียวกัน',p:'ทำงานผ่านเบราว์เซอร์ ไม่ต้องติดตั้งโปรแกรม ข้อมูลอัปเดตถึงกันทุกเครื่อง',d1:'Desktop ที่เคาน์เตอร์',d2:'Tablet หน้าลาน',d3:'Smartphone ของผู้บริหาร'},
 rel:[{t:'เข้ารหัสการเชื่อมต่อ',d:'ข้อมูลรับส่งผ่าน HTTPS ตลอดเส้นทาง แนวทางเดียวกับบริการธนาคารออนไลน์'},{t:'สิทธิ์ตามตำแหน่ง',d:'กำหนดได้ว่าใครเห็นราคา ใครอนุมัติ ใครแก้เอกสาร พร้อมรายงานตรวจสอบการใช้งาน'},{t:'ข้อมูลอยู่บน Cloud',d:'ข้อมูลไม่ผูกกับเครื่องใดเครื่องหนึ่ง เครื่องเสียหรือหายก็ทำงานต่อจากเครื่องอื่นได้'},{t:'อัปเดตถึงกันทุกเครื่อง',d:'ช่างปิดงานที่หน้าลาน เคาน์เตอร์เห็นบิล และผู้บริหารเห็นยอดต่อเนื่องกัน'}],
 cta:{eyebrow:'เริ่มต้นใช้งาน',h:'นัดดู Demo กับทีม DriveGo',p:'บอกขนาดอู่และงานที่อยากแก้ ทีมงานจะเตรียมตัวอย่างที่ตรงกับอู่ของคุณ',l1:'ดูระบบทำงานจริงตั้งแต่รับรถจนถึงออกใบกำกับภาษี',l2:'ถามตอบเรื่องโมดูลที่เหมาะกับอู่ของคุณ',l3:'โทร 082-108-7000 หรืออีเมล sales@drivegox.com'},
 form:{name:'ชื่อผู้ติดต่อ',shop:'ชื่ออู่หรือศูนย์บริการ',tel:'เบอร์โทร',br:'จำนวนสาขา',brs:['1 สาขา','2 ถึง 5 สาขา','6 สาขาขึ้นไป'],mod:'โมดูลที่สนใจ',all:'ทั้งระบบ',msg:'สิ่งที่อยากให้ระบบช่วย (ไม่บังคับ)',send:'ขอนัด Demo',err:'กรอกชื่อ ชื่ออู่ และเบอร์โทรให้ครบก่อนส่ง',okh:'สรุปคำขอพร้อมแล้ว',okp:'คัดลอกข้อความนี้ส่งมาที่ sales@drivegox.com หรือโทร 082-108-7000 เพื่อนัดเวลา',copy:'คัดลอกข้อความ',mail:'ส่งทางอีเมล',line:'คัดลอกแล้วส่งทาง LINE',copied:'คัดลอกแล้ว',edit:'แก้ไขข้อมูล',sumh:'ขอนัด Demo DriveGo ProX'},
 why:{eyebrow:'ปัญหาที่อู่เจอ',h:'ศูนย์บริการของคุณเจอปัญหาเหล่านี้หรือไม่',fixl:'DriveGo ช่วยได้',q:['ปลวกกิน น้ำรั่ว แฟ้มหาย เอกสารกระดาษเสียหายได้ทุกวัน','ซื้อมา 100 ขาย 200 ลดให้ลูกค้า 20 เหลือกำไร 80 จริงหรือเปล่า','นับสต๊อกแต่ละครั้ง ไม่รู้จะเริ่มตรงไหน และจะเสร็จเมื่อไร','ลูกค้าไม่กลับมา แปลว่าเราซ่อมจบ หรือเขาไปอู่อื่นแล้ว'],foot:'ปัญหาเหล่านี้ไม่ได้เกิดจากช่างไม่เก่ง แต่เกิดจากอู่ยังไม่มีระบบกลางที่เก็บข้อมูลไว้ที่เดียว',
  pain:[['เอกสารยังอยู่บนกระดาษ','ใบสั่งซ่อม ใบเสนอราคา และใบเสร็จเขียนด้วยมือ ค้นย้อนหลังไม่ได้ และตกหล่นบ่อย'],['ไม่รู้ต้นทุนจริงของงาน','ค่าแรง ค่าอะไหล่ และส่วนลดปนกันอยู่ สิ้นเดือนจึงไม่รู้ว่างานไหนได้กำไรจริง'],['สต๊อกอะไหล่คุมไม่อยู่','ของที่มีลูกค้าไม่มาซ่อม ของที่ต้องใช้กลับไม่มี เกิดของค้างสต๊อกจมทุน'],['ลูกค้าไม่กลับมาใช้ซ้ำ','ไม่มีประวัติรถรายคัน ไม่มีการแจ้งเตือนรอบเซอร์วิส ลูกค้าจึงหายไปอย่างเงียบ ๆ']],
  bt:'ก่อนใช้ DriveGo',bh:'ทำงานด้วยความจำและกระดาษ',b:['ค้นใบสั่งซ่อมเก่าต้องรื้อแฟ้มทีละเล่ม','รู้กำไรตอนสิ้นเดือน และมักไม่ตรงกับที่คิดไว้','สั่งอะไหล่ตามความรู้สึก ของขาดสลับกับของค้าง','ลูกค้าจะกลับมาหรือไม่ ขึ้นอยู่กับว่าลูกค้าจำเราได้ไหม'],
  at:'หลังใช้ DriveGo',ah:'ทำงานด้วยข้อมูลชุดเดียวกันทั้งอู่',a:['ค้นประวัติงานจากทะเบียนรถได้ในไม่กี่วินาที','เห็นต้นทุนและกำไรรายบิลทันทีที่ปิดงาน','ระบบแจ้งเตือนอะไหล่ใกล้หมดก่อนของขาด','ระบบเตือนรอบเซอร์วิส ทำให้ลูกค้ากลับมาเป็นรอบ§']},
 plans:{eyebrow:'ผลิตภัณฑ์',h:'เลือกระบบให้ตรงกับขนาดของอู่',p:'อัปเกรดข้ามรุ่นได้ทุกเมื่อ ข้อมูลลูกค้า ประวัติรถ และเอกสารเดิมยังอยู่ครบ ไม่ต้องเริ่มใหม่',
  pk:[{n:'BaziX',tag:['Professional','System'],f:'อู่ขนาดกลาง ช่าง 4 ถึง 10 คน อู่เฉพาะทาง และศูนย์บริการขนาดกลาง',l:['ใบสั่งซ่อม ใบเสนอราคา ใบเสร็จ และใบกำกับภาษี','คลังอะไหล่และตัดสต๊อกอัตโนมัติ','ต้นทุนและกำไรรายบิล','แจ้งเตือนรอบเซอร์วิสถึงลูกค้า§','ผลงานช่างรายคนและการคิดค่าแรง§','กำหนดสิทธิ์ผู้ใช้หลายระดับ']},
      {n:'ProX',tag:['Top Performance','System'],f:'อู่ขนาดใหญ่หรือหลายสาขา ศูนย์บริการเครือข่าย และธุรกิจที่วางแผนขยายแฟรนไชส์',l:['ทุกความสามารถของ BaziX','จัดการหลายสาขาในระบบเดียว','มาตรฐานเอกสารและขั้นตอนเดียวกันทุกสาขา','แดชบอร์ดวิเคราะห์เชิงลึก','เปรียบเทียบผลงานระหว่างสาขา','เชื่อมต่อระบบภายนอกผ่าน API§']},
      {n:'BOOK',tag:['Userbook','System'],f:'บริการที่เชื่อมผู้ใช้รถกับอู่ในเครือข่าย DriveGo Ecosystem',l:['ค้นหาอู่ใกล้ตัวและนัดหมายเข้ารับบริการ','ผู้ใช้รถดูประวัติรถของตัวเองได้','ประวัติถูกบันทึกให้เองจากงานซ่อมจริง','เปิดเผยเฉพาะข้อมูลที่ได้รับความยินยอม','อู่เห็นประวัติซ่อมย้อนหลังของรถคันนั้น','ทำ Co-Marketing ร่วมกันทั้งเครือข่าย']}],
  ch:'ความสามารถ',rows:['เปิดใบสั่งซ่อมและติดตามสถานะงาน','ใบเสนอราคา ใบเสร็จ และเอกสารภาษี','ประวัติรถและข้อมูลลูกค้า','รายงานยอดขาย','แจ้งเตือนรอบเซอร์วิสถึงลูกค้า§','คลังอะไหล่และตัดสต๊อกอัตโนมัติ','ต้นทุนและกำไรรายบิล','ผลงานช่างและการคิดค่าแรง§','กำหนดสิทธิ์ผู้ใช้หลายระดับ','จัดการหลายสาขาในระบบเดียว','แดชบอร์ดวิเคราะห์เชิงลึก','เชื่อมต่อระบบภายนอก (API)§'],yes:'มี',no:'ไม่มี',per:'ต่อปี',vat:'ยังไม่รวมภาษีมูลค่าเพิ่ม',fr:'DriveGo-Franchise ใช้ราคาเดียวกับ ProX',soon:'กำหนดเปิดใช้งาน',when:'ประมาณพฤษภาคม 2570',fee:'ค่าบริการรายปี (ยังไม่รวมภาษีมูลค่าเพิ่ม)'},
 start:{h:'เริ่มใช้งานใน 4 ขั้น',note:'ไม่ต้องหยุดรับงานเพื่อเปลี่ยนระบบ อู่ยังทำงานตามปกติระหว่างติดตั้งและอบรม',why:'ทำไมต้องเป็น DriveGo',
  s:[['สำรวจหน้างาน','ทีมงานเข้าดูขั้นตอนการทำงานจริงของอู่ เพื่อตั้งค่าให้ตรงกับวิธีทำงานเดิม'],['ตั้งค่าระบบ','นำเข้าข้อมูลลูกค้า รายการอะไหล่ และราคาค่าแรง พร้อมตั้งรูปแบบเอกสารของอู่'],['อบรมทีมงาน','สอนช่างและพนักงานหน้าร้านใช้งานจริงทีละขั้น จนเปิดงานและปิดบิลได้เอง'],['ใช้งานจริงและดูแลต่อเนื่อง','ติดตามผลช่วงแรก ปรับระบบให้เข้ากับอู่ และมีทีมไทยช่วยเหลือหลังการขาย']],
  w:[['ออกแบบจากหน้างานอู่ไทย','ทีมงานมาจากสายอะไหล่และงานบริการรถยนต์จริง เข้าใจข้อจำกัดของอู่'],['เริ่มเล็กแล้วค่อยโตได้','เลือกรุ่นตามขนาดอู่วันนี้ และอัปเกรดได้เมื่อพร้อม'],['ใช้งานง่าย ช่างก็ใช้ได้','หน้าจอภาษาไทย ปุ่มน้อย ขั้นตอนสั้น ลดเวลาอบรม'],['มีทีมไทยดูแลต่อเนื่อง','ติดตั้ง อบรม และช่วยเหลือหลังการขายโดยทีมงานคนไทย']]},
 priv:{eyebrow:'ความเป็นส่วนตัวของข้อมูล',h:'นโยบายความเป็นส่วนตัว',p1:'บริษัทให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคล โดยเก็บรวบรวม ใช้ และเปิดเผยข้อมูลเท่าที่จำเป็นตามวัตถุประสงค์ที่แจ้งไว้ ภายใต้พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562',p2:'เจ้าของข้อมูลมีสิทธิขอเข้าถึง แก้ไข ลบ หรือถอนความยินยอมได้ตามที่กฎหมายกำหนด ติดต่อ <a href="mailto:sales@drivegox.com">sales@drivegox.com</a>',r:['ขอเข้าถึงข้อมูล','ขอแก้ไข','ขอลบ','ถอนความยินยอม'],link:'อ่านนโยบายฉบับเต็ม',form:'ข้อมูลที่กรอกใช้เพื่อติดต่อกลับเรื่องการนัด Demo เท่านั้น ดูรายละเอียดที่'},
 foot:{tag:'ระบบนิเวศบริการรถยนต์ครบวงจร สำหรับอู่ซ่อมรถและศูนย์บริการ',prod:'ผลิตภัณฑ์',menu:'เมนู',support:'ฝ่ายสนับสนุน',rights:'สงวนลิขสิทธิ์',co:'บริษัท ไดร์ฟบิซ เมคคาไลซ์ โซลูชั่น จำกัด',addr:'เลขที่ 66 ซอยแสมดำ 13 แขวงแสมดำ เขตบางขุนเทียน กรุงเทพมหานคร 10150'},
 m:{shop:'DrivegoGarage',nav:['แดชบอร์ด','งานซ่อม','ใบเสนอราคา','บิล ใบเสร็จ','สต๊อก','บัญชี','ภาษี','พนักงาน'],
  dash:'แดชบอร์ดธุรกิจ',per:'ก.ค. 69',inc:'รายได้',exp:'รายจ่าย',net:'กำไรสุทธิ',ar:'ลูกหนี้ค้างชำระ',chart:'รายได้เทียบรายจ่าย',mo:['ก.ย.','ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.'],
  queue:'คิวงานวันนี้',wait:'รอรับงาน',work:'กำลังซ่อม',pend:'รอชำระ',paid:'ชำระแล้ว',
  brake:'ตรวจเบรก + ผ้าเบรก',s60:'เช็กระยะ 60,000 กม.',ac:'ล้างแอร์ / เปลี่ยนกรองแอร์',shock:'เปลี่ยนโช้คหลังคู่',tire:'ปะยาง + สลับยาง',
  parts:'ตัดสต๊อก',pad:'ผ้าเบรกหน้า ×1',kit:'น้ำมันเครื่อง ×1, กรอง ×2',tech:['ช่างเอก','ช่างบอย','ช่างหนึ่ง'],sk:['เครื่องยนต์ Hybrid','ช่วงล่าง เบรก','แอร์ ไฟฟ้า'],assign:'มอบหมายช่าง',free:'ว่าง',busy:'กำลังทำ',
  aging:'อายุลูกหนี้',ag:['0 ถึง 7 วัน','8 ถึง 30 วัน','เกิน 30 วัน'],bill:'ใบ',days:'วัน',walk:'ลูกค้าทั่วไป',
  bills:'ทะเบียนใบเสร็จ',vat:'สรุปภาษี ภ.พ.30',sales:'ยอดขายรวม VAT',base:'ฐานภาษี',vat7:'ภาษีขาย 7%',due:'กำหนดยื่น 15 ส.ค. 69',over:'ค้าง',
  crm:'ศูนย์แจ้งเตือนลูกค้า',ins:'ต่อประกันภัย',tax:'ต่อภาษีรถประจำปี',svc:'เช็กระยะ 60,000 กม.',left:'เหลือ 1,080 กม.',d5:'5 ก.ย. 69',d2:'2 ต.ค. 69',coins:'DriveGo Coins',
  stock:'สต๊อกของฉัน',min:'ขั้นต่ำ',auto:'เปิดใบขอซื้ออัตโนมัติ',pcs:'ชิ้น',
  docs:'เอกสารต่อเนื่อง',fl:['ใบเสนอราคา','ใบแจ้งหนี้','ใบเสร็จ','ใบกำกับภาษี'],fin:'สรุปเดือนนี้',
  appr:'เอกสารรออนุมัติ',po:'ใบสั่งซื้อ',wd:'ใบเบิกอะไหล่',dc:'ส่วนลด 10%',by:'ผู้ขอ',st:'ฝ่ายสต๊อก',cs:'เคาน์เตอร์',yes:'อนุมัติ',no:'ไม่อนุมัติ',ok:'อนุมัติแล้ว',
  hist:'ประวัติซ่อม 8กด 5219',h1:'17 ส.ค. 69',h2:'12 ก.พ. 69',h3:'20 พ.ย. 68',s50:'เช็กระยะ 50,000 กม.',rot:'สลับยาง + ตั้งศูนย์',war:'รับประกันงานซ่อม 6 เดือน หรือ 10,000 กม.',rate:'คะแนนจากลูกค้า',
  brc:'ยอดขายรายสาขา',br:['ลาดพร้าว','พระราม 9','รัชดา'],tr:'โอนอะไหล่ระหว่างสาขา',trd:'ผ้าเบรกหน้า ×4 จากลาดพร้าวไปรัชดา',way:'กำลังจัดส่ง',
  nw:['ซัพพลายเออร์','ประกันภัย','แอปผู้ใช้รถ','สาขา','Tablet หน้าลาน','มือถือผู้บริหาร'],hub:'Cloud',
  today:'วันนี้',sum:'สรุปวันนี้',jobs:'งานในอู่'}},
en:{
 soon:'Coming soon',
 nav:{eco:'Ecosystem',plans:'Packages',art:'Articles',login:'Log in',show:'Screens',cloud:'Cloud & devices',contact:'Contact',cta:'Request a demo'},
 hero:{eyebrow:'Cloud garage & service-centre management',h:'Accurate information <em>leads to successful management</em>',
  p:{l1:'The complete cloud system for car repair garages and service centres',l2:'For managers who need <em>data to run the business and make decisions</em>',k:['Financial figures','Stock','Control at every step']},
  pil:[['Covers every part of the business','Workshop, stock, accounts and customers in 8 modules'],['Manage in fine detail','Profit and loss per car, per day and per branch§'],['Secured by permission-based approvals','Rights set by position, sign-off before anything important'],['Builds a healthy ecosystem','Links customers, suppliers, insurers and branches§']],
  cta1:'Book a demo',cta2:'See the 8 modules',f1:'modules in one system',f3:'devices: PC, tablet, mobile',
  fl1a:'Coins issued to customer§',fl1b:'+12 Coins from receipt RC-6908-001',fl2a:'Reorder point reached',fl2b:'Cabin filter (EV) down to 8. PO-001 raised.§',note:'Figures and names on screen are sample data'},
 eco:{eyebrow:'All-in-One Ecosystem',h:'Eight modules working as one system',p:'Pick a module to see its screen. Data flows on from the quotation all the way to the financial statements.'},
 mods:[
  {t:'Marketing & CRM',s:'Customer relationships',d:'Customers are tied to their licence plates. The system works out service, road-tax and insurance dates from real mileage and sends the reminders for you.§',b:['Membership and DriveGo Coins earned from paid receipts§','Service reminders timed by average daily distance§','Promotions and coupons that bring past customers back§']},
  {t:'Workshop & Bay Management',s:'The workshop floor',d:'The repair board updates the moment a status changes. See which car is at which stage and which technician owns it.§',b:['Bookings, walk-ins and quotations on one board§','Assign technicians and see each person’s workload§','Closing a job issues the receipt and deducts stock']},
  {t:'Inventory & Parts Stock',s:'Parts stock control',d:'A parts register with Min and Max levels. Stock is deducted when a repair is approved, and a purchase request opens itself at the reorder point.§',b:['Automatic deduction from job orders and sales bills','Alerts for reorder point, overstock and dead stock','Item codes and barcodes for receiving, issuing and counting§']},
  {t:'Accounting & Finance',s:'Books and cash',d:'Sales documents run from quotation to invoice, receipt and tax invoice. Entries are posted and tax is summarised every period.',b:['Receivables, payables and cash position on one page','Output VAT, input VAT and withholding tax reports','Profit and loss per car, per day, and annual statements§']},
  {t:'E-Document Approval',s:'Approvals on the go',d:'Purchase orders, parts requisitions and discounts go to the right approver, who can sign off from a phone without coming in.',b:['A bell for documents waiting on your approval','See amount, requester and reason before deciding','Approver and time are logged for later review']},
  {t:'After-Sales Service',s:'After the handover',d:'Every visit adds to the car’s service history, together with the repair warranty period and a satisfaction survey after pickup.§',b:['Service history searchable by licence plate','Check-up reminders within the warranty period','Ratings and reviews from customers after each job§']},
  {t:'Multi-Branch & Franchise',s:'Branches and franchises',d:'Head office sees every branch, compares sales, and moves parts between branches when one runs short.',b:['Group dashboard with a view per branch','Inter-branch parts transfers with documents','One price list and one permission set across the group']},
  {t:'Business Network & Cloud',s:'A connected network',d:'Connects the garage with parts suppliers, insurers and the driver app. It runs in the browser on any device.§',b:['Order from the central catalogue at supplier-direct prices§','Receive bookings, quote requests and roadside jobs from the driver app§','PC, tablet and mobile share the same data']}],
 show:{eyebrow:'Interactive Showcase',h:'A closer look, by role',p:'Tap an amber dot on the screen, or an item in the list, to read what that area does.',td:'Test Drive: see all 58 real screens'},
 roles:[
  {t:'Owner',d:'Business overview',hs:[{t:'Four business figures',d:'Income, expenses, net profit and outstanding receivables. Switch between month, quarter and 12 months.'},{t:'Income against expenses',d:'The monthly chart is built from receipts and recorded expenses. Nobody adds numbers up by hand.'},{t:'Receivables ageing',d:'Outstanding bills grouped by days overdue, so you know which to chase first.'}]},
  {t:'Workshop foreman',d:'Repair queue board§',hs:[{t:'Status of every car',d:'A colour stripe shows the stage: waiting, in repair, awaiting payment, paid.'},{t:'Parts to be deducted',d:'Parts linked to the job are shown up front and deducted when the job is closed.'},{t:'Assigning technicians§',d:'Pick a technician by skill. The name appears on the job card and counts towards workload.'}]},
  {t:'Accounting',d:'Bills and tax',hs:[{t:'Receipt register',d:'Search by document number, plate or item, and record payment from the same row.'},{t:'Status and age',d:'Colour tags separate paid from pending, with the number of days overdue.'},{t:'Tax summary for the period',d:'Output VAT is estimated from paid receipts, with the PP30 filing date.'}]}],
 dev:{eyebrow:'Multi-Device & Cloud',h:'Front desk, workshop floor and management see the same data',p:'It runs in the browser with nothing to install, and every device stays up to date.',d1:'Desktop at the counter',d2:'Tablet on the floor',d3:'Smartphone for management'},
 rel:[{t:'Encrypted connection',d:'Data travels over HTTPS end to end, the same approach online banking uses.'},{t:'Permissions by position',d:'Decide who sees prices, who approves and who edits documents, with a usage audit report.'},{t:'Your data lives in the cloud',d:'Nothing is tied to one machine. If a computer fails or goes missing, carry on from another.'},{t:'Every device in step',d:'A technician closes a job, the counter sees the bill, and management sees the total.'}],
 cta:{eyebrow:'Get started',h:'Book a demo with the DriveGo team',p:'Tell us the size of your garage and what you want to fix. We will prepare an example that fits your shop.',l1:'See the full flow from check-in to tax invoice',l2:'Ask which modules suit your garage',l3:'Call 082-108-7000 or e-mail sales@drivegox.com'},
 form:{name:'Contact name',shop:'Garage or service centre',tel:'Phone',br:'Branches',brs:['1 branch','2 to 5 branches','6 or more'],mod:'Module of interest',all:'The whole system',msg:'What should the system help with? (optional)',send:'Request a demo',err:'Enter your name, garage name and phone number first',okh:'Your request summary is ready',okp:'Copy this message and send it to sales@drivegox.com, or call 082-108-7000 to arrange a time.',copy:'Copy message',mail:'Send by e-mail',line:'Copy and send on LINE',copied:'Copied',edit:'Edit details',sumh:'DriveGo ProX demo request'},
 why:{eyebrow:'The problem',h:'Does your service centre face these problems?',fixl:'With DriveGo',q:['Termites, leaks, lost folders: paper can be ruined any day.','Bought at 100, sold at 200, gave 20 off. Is the profit really 80?','Every stock count: where to start, and when will it end?','No return visit: was the repair that good, or did they go elsewhere?'],foot:'None of this happens because the technicians lack skill. It happens because the garage has no central system that keeps its data in one place.',
  pain:[['Paperwork is still on paper','Job orders, quotations and receipts are handwritten, hard to look up later, and often incomplete.'],['The real cost of a job is unknown','Labour, parts and discounts are mixed together, so at month end nobody knows which jobs made money.'],['Parts stock is out of control','What is on the shelf is not what customers need, and capital sits in slow stock.'],['Customers do not come back','No per-car history and no service reminders, so customers quietly drift away.']],
  bt:'Before DriveGo',bh:'Running on memory and paper',b:['Finding an old job order means digging through files','Profit is known at month end, and rarely matches expectations','Parts are ordered by feel, swinging between shortage and surplus','Whether a customer returns depends on whether they remember you'],
  at:'After DriveGo',ah:'One set of data for the whole garage',a:['Find a car’s history from its plate in seconds','See cost and profit per bill as soon as the job closes','Low-stock alerts arrive before parts run out','Service reminders bring customers back on schedule§']},
 plans:{eyebrow:'Products',h:'Choose the system that fits your garage',p:'Upgrade between editions at any time. Customer data, car history and past documents stay in place.',
  pk:[{n:'BaziX',tag:['Professional','System'],f:'Mid-size garages with 4 to 10 technicians, specialist shops and mid-size service centres',l:['Job orders, quotations, receipts and tax invoices','Parts warehouse with automatic stock deduction','Cost and profit per bill','Service reminders sent to customers§','Technician performance and labour pay§','Multi-level user permissions']},
      {n:'ProX',tag:['Top Performance','System'],f:'Large or multi-branch garages, service networks and businesses planning to franchise',l:['Everything in BaziX','Manage many branches in one system','One document and process standard for every branch','In-depth analytics dashboard','Compare performance across branches','Connect external systems through an API§']},
      {n:'BOOK',tag:['Userbook','System'],f:'The service that connects drivers with garages in the DriveGo Ecosystem',l:['Find a nearby garage and book a visit','Drivers can see their own car history','History is recorded automatically from real repair jobs','Only data the driver consents to is shared','Garages see the car’s past repairs','Co-marketing across the whole network']}],
  ch:'Capability',rows:['Job orders and job status tracking','Quotations, receipts and tax documents','Car history and customer data','Sales reports','Service reminders to customers','Parts warehouse and automatic stock deduction','Cost and profit per bill','Technician performance and labour pay§','Multi-level user permissions','Multi-branch management','In-depth analytics dashboard','External system connection (API)§'],yes:'Included',no:'Not included',per:'per year',vat:'Excluding VAT',fr:'DriveGo-Franchise is the same price as ProX',soon:'Planned launch',when:'Around May 2027',fee:'Annual service fee (excluding VAT)'},
 start:{h:'Up and running in 4 steps',note:'No need to stop taking jobs. The garage keeps working as usual during setup and training.',why:'Why DriveGo',
  s:[['Site survey','Our team studies how your garage really works, so the setup matches your existing process.'],['System setup','Import customers, parts lists and labour rates, and set up your document formats.'],['Team training','Technicians and front-desk staff practise step by step until they can open jobs and close bills alone.'],['Go live with ongoing care','We follow up in the early weeks, tune the system, and support you after the sale.']],
  w:[['Designed on the Thai workshop floor','The team comes from parts supply and car service, and knows a garage’s constraints.'],['Start small, grow later','Pick the edition that fits today and upgrade when you are ready.'],['Easy enough for every technician','Few buttons and short steps, so training is quick.'],['A Thai team that stays with you','Installation, training and after-sales support from a local team.']]},
 priv:{eyebrow:'Data privacy',h:'Privacy policy',p1:'The company takes the protection of personal data seriously. We collect, use and disclose data only as necessary for the purposes we have stated, under Thailand’s Personal Data Protection Act B.E. 2562 (2019).',p2:'Data subjects may request access, correction or deletion, or withdraw consent, as the law provides. Contact <a href="mailto:sales@drivegox.com">sales@drivegox.com</a>',r:['Access','Correction','Deletion','Withdraw consent'],link:'Read the full policy',form:'The details you enter are used only to contact you about a demo. See our'},
 foot:{tag:'A complete automotive service ecosystem for garages and service centres',prod:'Products',menu:'Menu',support:'Support',rights:'All rights reserved.',co:'Drivebiz Mecalyze Solution Co., Ltd.',addr:'66 Soi Samae Dam 13, Samae Dam, Bang Khun Thian, Bangkok 10150, Thailand'},
 m:{shop:'DrivegoGarage',nav:['Dashboard','Repair jobs','Quotations','Bills & receipts','Stock','Accounting','Tax','Staff'],
  dash:'Business dashboard',per:'Jul 2026',inc:'Income',exp:'Expenses',net:'Net profit',ar:'Receivables',chart:'Income against expenses',mo:['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul'],
  queue:'Today’s queue',wait:'Waiting',work:'In repair',pend:'Awaiting payment',paid:'Paid',
  brake:'Brake check + pads',s60:'60,000 km service',ac:'A/C clean + cabin filter',shock:'Rear shock pair',tire:'Puncture + rotation',
  parts:'Deducts',pad:'Front brake pads ×1',kit:'Engine oil ×1, filters ×2',tech:['Ek','Boy','Nueng'],sk:['Engine, hybrid','Suspension, brakes','A/C, electrical'],assign:'Assign technician',free:'Free',busy:'Working',
  aging:'Receivables ageing',ag:['0 to 7 days','8 to 30 days','Over 30 days'],bill:'bills',days:'days',walk:'Walk-in',
  bills:'Receipt register',vat:'VAT summary (PP30)',sales:'Sales incl. VAT',base:'Tax base',vat7:'Output VAT 7%',due:'File by 15 Aug 2026',over:'overdue',
  crm:'Customer reminders',ins:'Insurance renewal',tax:'Annual road tax',svc:'60,000 km service',left:'1,080 km to go',d5:'5 Sep 2026',d2:'2 Oct 2026',coins:'DriveGo Coins',
  stock:'My stock',min:'min',auto:'Purchase request raised',pcs:'pcs',
  docs:'Document chain',fl:['Quotation','Invoice','Receipt','Tax invoice'],fin:'This month',
  appr:'Awaiting approval',po:'Purchase order',wd:'Parts requisition',dc:'10% discount',by:'From',st:'Stock',cs:'Counter',yes:'Approve',no:'Reject',ok:'Approved',
  hist:'Service history 8กด 5219',h1:'17 Aug 2026',h2:'12 Feb 2026',h3:'20 Nov 2025',s50:'50,000 km service',rot:'Rotation + alignment',war:'Repair warranty: 6 months or 10,000 km',rate:'Customer rating',
  brc:'Sales by branch',br:['Lat Phrao','Rama 9','Ratchada'],tr:'Inter-branch transfer',trd:'Front brake pads ×4, Lat Phrao to Ratchada',way:'In transit',
  nw:['Suppliers','Insurers','Driver app','Branches','Floor tablet','Manager phone'],hub:'Cloud',
  today:'Today',sum:'Today',jobs:'Jobs in shop'}}
};
/* ============ helpers ============ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let lang='th', mod=0, role=0, hot=0;
const dig=(o,k)=>k.split('.').reduce((a,p)=>a==null?a:a[p],o);
const t=k=>{const v=dig(I[lang],k);return v==null?dig(I.th,k):v};
// A text ending in § is something the system does not do yet: its tag.
const sn=x=>typeof x==='string'&&x.endsWith('§')?x.slice(0,-1)+` <span class="coming">${t('soon')}</span>`:x;
const put=(e,x)=>{const s=typeof x==='string'&&x.endsWith('§');e.textContent=s?x.slice(0,-1):x;if(s){const b=document.createElement('span');b.className='coming';b.textContent=t('soon');e.append(' ',b)}};
function applyCss(r=document){$$('[data-css]',r).forEach(e=>{for(const d of e.dataset.css.split(';')){const i=d.indexOf(':');if(i>0)e.style.setProperty(d.slice(0,i).trim(),d.slice(i+1).trim())}})}
const B=n=>'฿'+n.toLocaleString('en-US');
const ic=n=>`<svg class="ic"><use href="#i-${n}"/></svg>`;
const MOD_IC=['crm','bay','box','fin','doc','shield','branch','cloud'];
const INC=[41.2,44.8,39.5,52.6,47.3,43.8,49.6,38.9,51.2,46.7,53.4], EXP=[26.8,27.5,26.2,31.4,28.9,27.1,29.8,30.2,29.4,28.3,30.1];

/* ============ product screens ============ */
function win(title,body,navI,cls=''){const m=t('m');
  return `<div class="ui ${cls}"><div class="ui-top"><i></i><i></i><i></i><b>${title}</b><span>${m.shop}</span></div>
  <div class="ui-main"><div class="ui-side">${m.nav.map((n,i)=>`<u class="${i===navI?'on':''}">${n}</u>`).join('')}</div><div class="ui-body">${body}</div></div></div>`}
const hs=i=>`<button class="hs" type="button" data-h="${i}" aria-label="${i+1}">${i+1}<svg class="hand" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 14a8 8 0 0 1-8 8h-2c-2.800 0-4.500-.860-5.990-2.340l-3.600-3.600a2 2 0 0 1 2.830-2.820L7 15V4a2 2 0 0 1 4 0v5.500V9a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v1a2 2 0 0 1 3 0z"/></svg></button>`;
function kp(h){const m=t('m');return `<div class="kp hst" data-t="0"><div class="g"><b>${B(53400)}</b><span>${m.inc}</span></div><div class="r"><b>${B(30100)}</b><span>${m.exp}</span></div><div class="a"><b>${B(23300)}</b><span>${m.net}</span></div><div><b>${B(3250)}</b><span>${m.ar}</span></div>${h?hs(0):''}</div>`}
function chart(h){const m=t('m');return `<div class="pn hst" data-t="1"><h5>${m.chart}<small>${m.per}</small></h5><div class="bars">${INC.map((v,i)=>`<div><i class="a" data-css="height:${v/53.4*100}%;animation-delay:${i*.05}s"></i><i class="b" data-css="height:${EXP[i]/53.4*100}%;animation-delay:${i*.05+.1}s"></i></div>`).join('')}</div><div class="bl">${m.mo.map(x=>`<span>${x}</span>`).join('')}</div>${h?hs(1):''}</div>`}
function queue(){const m=t('m');return `<div class="pn"><h5>${m.queue}<small>3</small></h5>
  <div class="row"><div><b>BK-0003 · 8กด 5219</b><small>${m.brake}</small></div><span class="tg t-w">${m.wait}</span></div>
  <div class="row"><div><b>BK-0002 · 2ขค 1846</b><small>${m.s60} · ${m.tech[0]}</small></div><span class="tg t-b">${m.work}</span></div>
  <div class="row"><div><b>BK-0001 · 8กด 5219</b><small>${m.ac}</small></div><span class="tg t-g">${m.paid}</span></div></div>`}
function aging(h){const m=t('m');return `<div class="pn hst" data-t="2"><h5>${m.aging}</h5>
  <div class="row"><div><b>${m.ag[0]}</b><small>0 ${m.bill}</small></div><span class="v">${B(0)}</span></div>
  <div class="row"><div><b>${m.ag[1]}</b><small>1 ${m.bill} · RC-6907-090</small></div><span class="v">${B(2400)}</span></div>
  <div class="row"><div><b data-css="color:var(--bad)">${m.ag[2]}</b><small>1 ${m.bill} · RC-6906-051</small></div><span class="v" data-css="color:var(--bad)">${B(850)}</span></div>${h?hs(2):''}</div>`}
const sDash=(h,right)=>kp(h)+`<div class="two">${chart(h)}${right==='ar'?aging(h):queue()}</div>`;
function kanban(h){const m=t('m');return `<div class="kb">
  <div><h6>${m.wait}<span>1</span></h6><div class="jc hst" data-t="1"><b>BK-0003 · 16:30</b><small>Toyota Corolla Cross · 8กด 5219</small><small>${m.brake}</small><small class="pt">${m.parts}: ${m.pad}</small>${h?hs(1):''}</div></div>
  <div><h6>${m.work}<span>1</span></h6><div class="jc b hst" data-t="0"><b>BK-0002 · 14:00</b><small>Isuzu D-Max · 2ขค 1846</small><small>${m.s60}</small><small class="pt">${m.parts}: ${m.kit}</small><span class="tg t-b" data-css="margin-top:.5em">${m.tech[0]}</span>${h?hs(0):''}</div></div>
  <div><h6>${m.pend}<span>1</span></h6><div class="jc o"><b>RC-6907-090</b><small>${m.walk}</small><small>${m.shock} · ${B(2400)}</small></div></div>
  <div><h6>${m.paid}<span>1</span></h6><div class="jc g"><b>BK-0001 · 09:00</b><small>Toyota Corolla Cross · 8กด 5219</small><small>${m.ac} · ${B(1200)}</small></div></div></div>`}
function techs(h){const m=t('m');return `<div class="pn hst" data-t="2"><h5>${m.assign}</h5>${m.tech.map((n,i)=>`<div class="row"><div><b>${n}</b><small>${m.sk[i]}</small></div><span class="tg ${i===0?'t-b':'t-g'}">${i===0?m.busy+' BK-0002':m.free}</span></div>`).join('')}${h?hs(2):''}</div>`}
function bills(h){const m=t('m');const R=[['RC-6908-002','2ขค 1846',m.s60,4200,1,0],['RC-6908-001','8กด 5219',m.ac,1200,1,0],['RC-6907-090',m.walk,m.shock,2400,0,25],['RC-6906-051',m.walk,m.tire,850,0,41]];
  return `<div class="pn hst" data-t="0"><h5>${m.bills}<small>${m.per}</small></h5>${R.map((r,i)=>`<div class="row"><div><b>${r[0]} · ${r[1]}</b><small>${r[2]}</small></div><span class="v">${B(r[3])}<br><span class="tg ${r[4]?'t-g':'t-o'} ${i===2&&h?'hst':''}" ${i===2&&h?'data-t="1"':''}>${r[4]?m.paid:m.pend+' · '+m.over+' '+r[5]+' '+m.days}${i===2&&h?hs(1):''}</span></span></div>`).join('')}${h?hs(0):''}</div>`}
function vat(h){const m=t('m');return `<div class="pn hst" data-t="2"><h5>${m.vat}</h5>
  <div class="row"><div>${m.sales}</div><span class="v">${B(53400)}</span></div><div class="row"><div>${m.base}</div><span class="v">${B(49907)}</span></div>
  <div class="row"><div><b>${m.vat7}</b></div><span class="v" data-css="color:var(--glow)">${B(3493)}</span></div><div class="row"><small>${m.due}</small></div>${h?hs(2):''}</div>`}

/* module previews */
const MM=[
 ()=>{const m=t('m');return win(m.crm,`<div class="row"><div><b>Toyota Corolla Cross · 8กด 5219</b><small>1.8 HEV · 58,920 km</small></div><span class="pill"><span class="coin">DG</span>12 ${m.coins}</span></div>
   <div class="pn"><div class="row"><div><b>${m.ins}</b><small>${m.d5}</small></div><span class="tg t-o">19 ${m.days}</span></div><div class="row"><div><b>${m.svc}</b><small>${m.left}</small></div><span class="tg t-w">~27 ${m.days}</span></div><div class="row"><div><b>${m.tax}</b><small>${m.d2}</small></div><span class="tg t-g">46 ${m.days}</span></div></div>`,0,'nos')},
 ()=>win(t('m.queue'),kanban(0),1,'nos'),
 ()=>{const m=t('m');const S=[['Protect Filter PM2.5','PF-CC58',23,10],['Cabin Filter (EV)','CF-EV21',8,10],['Air Filter','AF-2286',18,8],['0W-20 4L','OIL-0W20',26,10],['POE ND-OIL 11','POE-250',8,5]];
   return win(m.stock,`<div class="pn">${S.map((s,i)=>{const low=s[2]<=s[3];return `<div class="row"><div><b>${s[0]}</b><small>${s[1]} · ${m.min} ${s[3]}${low?' · <span data-css="color:var(--bad)">'+m.auto+' PO-001</span>':''}</small></div><span class="v" data-css="color:${low?'var(--bad)':'var(--ok)'}">${s[2]} ${m.pcs}<span class="sb"><i data-css="width:${Math.min(100,s[2]/(s[3]*2.5)*100)}%;background:${low?'var(--bad)':'var(--ok)'};animation-delay:${i*.07}s"></i></span></span></div>`}).join('')}</div>`,4,'nos')},
 ()=>{const m=t('m');return win(m.fin,`<div class="pn"><h5>${m.docs}</h5><div class="flow">${m.fl.map((f,i)=>`<span class="${i===2?'on':''}">${f}</span>${i<3?'<em>→</em>':''}`).join('')}</div></div>
   <div class="pn"><div class="row"><div>${m.inc}</div><span class="v" data-css="color:var(--ok)">+${B(53400)}</span></div><div class="row"><div>${m.exp}</div><span class="v" data-css="color:var(--bad)">−${B(30100)}</span></div><div class="row"><div>${m.ar}</div><span class="v">${B(3250)}</span></div><div class="row"><div><b>${m.net}</b></div><span class="v" data-css="color:var(--glow);font-size:1.3em">${B(23300)}</span></div></div>`,5,'nos')},
 ()=>{const m=t('m');const A=[[m.po+' PO-001','Cabin Filter (EV) ×12',2640,m.st],[m.wd+' WD-014','POE ND-OIL 11 ×2',1040,m.tech[2]],[m.dc+' QT-002',m.brake,280,m.cs]];
   return win(m.appr,A.map(a=>`<div class="ap"><div class="hd"><b>${a[0]}</b><b data-css="color:var(--glow)">${B(a[2])}</b></div><small>${a[1]} · ${m.by}: ${a[3]}</small><div class="bt"><button type="button">${m.no}</button><button type="button" class="y">${m.yes}</button></div><div class="ok">✓ ${m.ok}</div></div>`).join(''),-1,'nos')},
 ()=>{const m=t('m');return win(m.hist,`<div class="pn"><div class="tl"><div><b>${m.ac}</b><small>${m.h1} · RC-6908-001 · ${B(1200)}</small></div><div><b>${m.s50}</b><small>${m.h2} · RC-6902-114 · ${B(3900)}</small></div><div><b>${m.rot}</b><small>${m.h3} · ${B(900)}</small></div></div></div>
   <div class="two"><div class="pn"><span class="tg t-g">${m.war}</span></div><div class="pn"><div class="row"><div>${m.rate}</div><span class="v"><span class="stars">★★★★★</span> 4.9</span></div></div></div>`,-1,'nos')},
 ()=>{const m=t('m');const V=[53400,49600,44800];return win(m.brc,`<div class="pn"><h5>${m.brc}<small>${m.per}</small></h5><div class="hb">${m.br.map((b,i)=>`<div><span>${b}</span><span class="t"><i data-css="width:${V[i]/534}%;animation-delay:${i*.12}s"></i></span><b>${B(V[i])}</b></div>`).join('')}</div></div>
   <div class="pn"><div class="row"><div><b>${m.tr} · TR-007</b><small>${m.trd}</small></div><span class="tg t-b">${m.way}</span></div></div>`,0,'nos')},
 ()=>{const m=t('m');const P=[[70,45],[70,125],[70,205],[330,45],[330,125],[330,205]];
   return `<div class="ui nos"><div class="ui-body"><svg class="net" viewBox="0 0 400 250" role="img" aria-label="DriveGo ProX network">${P.map(p=>`<line x1="200" y1="125" x2="${p[0]}" y2="${p[1]}"/>`).join('')}
   <circle class="h" cx="200" cy="125" r="44"/><text x="200" y="121" font-size="13" font-weight="700">DriveGo ProX</text><text class="s" x="200" y="139" font-size="10">${m.hub}</text>
   ${P.map((p,i)=>`<circle class="n" cx="${p[0]}" cy="${p[1]}" r="30"/><text x="${p[0]}" y="${p[1]+4}" font-size="${lang==='en'?8.5:9.5}">${m.nw[i]}</text>`).join('')}</svg></div></div>`}
];
const ROLE=[
 ()=>win(t('m.dash'),sDash(1,'ar'),0),
 ()=>win(t('m.queue'),kanban(1)+techs(1),1),
 ()=>win(t('m.bills'),`<div class="two">${bills(1)}${vat(1)}</div>`,3)
];

/* ============ render ============ */
function renderEco(anim){
  const M=t('mods');
  $('#tabs').innerHTML=M.map((x,i)=>`<button class="tab" type="button" role="tab" aria-selected="${i===mod}" data-m="${i}"><span class="ti">${ic(MOD_IC[i])}</span><span><span class="n">0${i+1}</span><b>${sn(x.t)}</b><small>${x.s}</small></span></button>`).join('');
  const x=M[mod];
  $('#ecoT').innerHTML=`<span class="eyebrow">0${mod+1} / 08</span><h3>${x.t}</h3><div class="sub">${x.s}</div><p>${sn(x.d)}</p><ul>${x.b.map(b=>`<li>${ic('check')}<span>${sn(b)}</span></li>`).join('')}</ul>`;
  $('#ecoM').innerHTML=MM[mod](); applyCss($('#ecoP'));
  if(anim){['#ecoT','#ecoM'].forEach(s=>{const e=$(s);e.classList.remove('swap');void e.offsetWidth;e.classList.add('swap')})}
}
function renderShow(anim){
  const R=t('roles');
  $('#roles').innerHTML=R.map((r,i)=>`<button type="button" role="tab" aria-selected="${i===role}" data-r="${i}">${r.t}<small>${sn(r.d)}</small></button>`).join('');
  $('#showS').innerHTML=ROLE[role](); applyCss($('#showS'));
  $('#hsL').innerHTML=R[role].hs.map((h,i)=>`<button class="hs-i ${i===hot?'on':''}" type="button" data-h="${i}"><span class="k">${i+1}</span><span><b>${sn(h.t)}</b><span class="d">${sn(h.d)}</span></span></button>`).join('');
  lit();
  if(anim){const e=$('#showS');e.classList.remove('swap');void e.offsetWidth;e.classList.add('swap')}
}
function lit(){$$('#showS .hst').forEach(e=>e.classList.toggle('lit',+e.dataset.t===hot));$$('#hsL .hs-i').forEach((e,i)=>e.classList.toggle('on',i===hot))}
function renderDevices(){
  const m=t('m');
  $('#heroUI').innerHTML=win(m.dash,sDash(0,'queue'),0);
  $('#dDesk').innerHTML=win(m.bills,`<div class="two">${bills(0)}${vat(0)}</div>`,3);
  $('#dTab').innerHTML=win(m.queue,kanban(0),1,'nos');
  $('#dPh').innerHTML=`<div class="ui nos"><div class="ui-top"><i></i><b data-css="margin-left:.3em">${m.sum}</b></div><div class="ui-body"><div class="kp"><div class="g"><b>${B(5400)}</b><span>${m.inc}</span></div><div class="a"><b>3</b><span>${m.jobs}</span></div></div><div class="ap"><div class="hd"><b>PO-001</b><b data-css="color:var(--glow)">${B(2640)}</b></div><div class="bt"><button type="button">${m.no}</button><button type="button" class="y">${m.yes}</button></div><div class="ok">✓ ${m.ok}</div></div></div></div>`;
}
function renderStatic(){
  $$('[data-i18n]').forEach(e=>put(e,t(e.dataset.i18n)));
  $$('[data-i18n-html]').forEach(e=>e.innerHTML=t(e.dataset.i18nHtml));
  $$('[data-i18n-aria]').forEach(e=>e.setAttribute('aria-label',t(e.dataset.i18nAria)));
  $('#pvr').innerHTML=t('priv.r').map(x=>`<span>${ic('check')}${x}</span>`).join('');
  const hp=t('hero.p'), KI=['fin','box','shield'];
  $('#lead').innerHTML=`<p class="l1"><b>DriveGo</b>${hp.l1}</p><p class="l2">${hp.l2}</p><div class="kw">${hp.k.map((k,i)=>`<span data-css="--k:${i*1.2}s">${ic(KI[i])}${k}</span>`).join('')}</div>`;
  const PI=['box','fin','shield','cloud'];
  $('#pil').innerHTML=t('hero.pil').map((p,i)=>`<div>${ic(PI[i])}<p><b>${sn(p[0])}</b><span>${sn(p[1])}</span></p></div>`).join('');
  const w=t('why'), PNI=['doc','fin','box','crm'];
  $('#pain').innerHTML=w.pain.map((x,i)=>`<article class="rv in" data-css="--d:${i*.09}s"><div class="pt"><span class="pi" data-css="--d:${i*.7}s">${ic(PNI[i])}</span><span class="no">0${i+1}</span></div><h3>${x[0]}</h3><p>${x[1]}</p><p class="q">${w.q[i]}</p><div class="fix">${ic('check')}<span><small>${w.fixl}</small>${sn(w.a[i])}</span></div></article>`).join('');
  $('#ba').innerHTML=`<div class="b"><h4>${w.bt}</h4><h3>${w.bh}</h3><ul>${w.b.map(x=>`<li>${ic('x')}<span>${x}</span></li>`).join('')}</ul></div><div class="vs">${ic('arrow')}</div><div class="a"><h4>${w.at}</h4><h3>${w.ah}</h3><ul>${w.a.map(x=>`<li>${ic('check')}<span>${sn(x)}</span></li>`).join('')}</ul></div>`;
  const pl=t('plans'), PR=['9,600','12,000',null];
  $('#pk').innerHTML=pl.pk.map((k,i)=>`<article class="rv in ${i===1?'hi':''}" data-css="--d:${i*.08}s"><span class="tg2">${Array.isArray(k.tag)?`<b>${k.tag[0]}</b>${k.tag[1]?`<i>${k.tag[1]}</i>`:''}`:k.tag}</span><h3>DriveGo <b>${k.n}</b></h3>${PR[i]?`<div class="price"><b>฿${PR[i]}</b><span>${pl.per}</span><small>${pl.vat}${i===1?' · '+pl.fr:''}</small></div>`:`<div class="price soon"><span>${pl.soon}</span><b>${pl.when}</b></div>`}<p class="for">${k.f}</p><ul>${k.l.map(x=>`<li>${ic('check')}<span>${sn(x)}</span></li>`).join('')}</ul></article>`).join('');
  $('#cmp').innerHTML=`<table><thead><tr><th scope="col">${pl.ch}</th><th scope="col">BaziX</th><th scope="col">ProX</th></tr></thead><tbody><tr class="fee"><td>${pl.fee}</td><td>฿9,600</td><td>฿12,000</td></tr>${pl.rows.map((r,i)=>`<tr><td>${sn(r)}</td><td class="${i<9?'y':'n'}" aria-label="${i<9?pl.yes:pl.no}">${i<9?'●':'–'}</td><td class="y" aria-label="${pl.yes}">●</td></tr>`).join('')}</tbody></table>`;
  const st=t('start');
  $('#steps').innerHTML=st.s.map(x=>`<li><div><b>${x[0]}</b><span>${x[1]}</span></div></li>`).join('');
  const WI=['bay','branch','role','sync'];
  $('#whyus').innerHTML=st.w.map((x,i)=>`<article><span class="ri">${ic(WI[i])}</span><div><h4>${x[0]}</h4><p>${x[1]}</p></div></article>`).join('');
  const RI=['lock','role','db','sync'];
  $('#rel').innerHTML=t('rel').map((r,i)=>`<article class="rv in glowc" data-css="--d:${i*.08}s"><span class="ri">${ic(RI[i])}</span><div><h4>${r.t}</h4><p>${r.d}</p></div></article>`).join('');
  const f=t('form'), br=$('#fBr'), mo=$('#fMod'), bi=br.selectedIndex, mi=mo.selectedIndex;
  br.innerHTML=f.brs.map(x=>`<option>${x}</option>`).join('');
  mo.innerHTML=`<option>${f.all}</option>`+t('mods').map(x=>`<option>${x.t.replace(/§$/,'')}</option>`).join('');
  if(bi>0)br.selectedIndex=bi; if(mi>0)mo.selectedIndex=mi;
  $('#fErr').textContent='';
}
function setLang(l){
  lang=l; document.documentElement.lang=l;
  $$('.lang button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===l));
  renderStatic(); renderEco(); renderShow(); renderDevices(); applyCss();
  if($('#ctaB').classList.contains('sent'))buildSum();
  try{localStorage.setItem('dg-lang',l)}catch(e){}
}

/* ============ interactions ============ */
$('.lang').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setLang(b.dataset.lang)});
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('.tab');if(!b)return;mod=+b.dataset.m;renderEco(true);const n=$(`#tabs [data-m="${mod}"]`);n.focus({preventScroll:true})});
$('#tabs').addEventListener('pointermove',e=>{const b=e.target.closest('.tab');if(!b)return;const r=b.getBoundingClientRect();b.style.setProperty('--mx',(e.clientX-r.left)/r.width*100+'%');b.style.setProperty('--my',(e.clientY-r.top)/r.height*100+'%')});
$('#rel').addEventListener('pointermove',e=>{const b=e.target.closest('article');if(!b)return;const r=b.getBoundingClientRect();b.style.setProperty('--mx',(e.clientX-r.left)/r.width*100+'%');b.style.setProperty('--my',(e.clientY-r.top)/r.height*100+'%')});
$('#roles').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;role=+b.dataset.r;hot=0;renderShow(true)});
$('#showS').addEventListener('click',e=>{const b=e.target.closest('.hs');if(!b)return;hot=+b.dataset.h;lit()});
$('#hsL').addEventListener('click',e=>{const b=e.target.closest('.hs-i');if(!b)return;hot=+b.dataset.h;lit()});
document.addEventListener('click',e=>{const b=e.target.closest('.ap .bt button.y');if(b)b.closest('.ap').classList.add('done')});

/* form: composes a message the visitor copies, or sends by e-mail or on LINE (#mailB, #lineB): nothing is stored */
function buildSum(){const f=t('form');const v=id=>$('#'+id).value.trim();
  $('#sum').textContent=[f.sumh,`${f.name}: ${v('fName')}`,`${f.shop}: ${v('fShop')}`,`${f.tel}: ${v('fTel')}`,`${f.br}: ${$('#fBr').value}`,`${f.mod}: ${$('#fMod').value}`,v('fMsg')?`${f.msg.replace(/\s*[（(].*$/,'')}: ${v('fMsg')}`:''].filter(Boolean).join('\n');mailTo()}
$('#demoForm').addEventListener('submit',e=>{e.preventDefault();
  if(!$('#fName').value.trim()||!$('#fShop').value.trim()||$('#fTel').value.replace(/\D/g,'').length<9){$('#fErr').textContent=t('form.err');return}
  buildSum();$('#ctaB').classList.add('sent')});
$('#editB').addEventListener('click',()=>$('#ctaB').classList.remove('sent'));
$('#copyB').addEventListener('click',async e=>{const b=e.currentTarget;try{await navigator.clipboard.writeText($('#sum').textContent);put(b,t('form.copied'))}catch(x){const r=document.createRange();r.selectNodeContents($('#sum'));const s=getSelection();s.removeAllRanges();s.addRange(r)}
  setTimeout(()=>put(b,t('form.copy')),1800)});

/* motion: sticky nav, scroll-linked tilt, pointer parallax, reveal, count-up */
const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
const tilt=$('#tilt'), stage=$('#stage'); let mX=0,mY=0,tick=false;
function frame(){tick=false;const y=scrollY;
  $('#nav').classList.toggle('stuck',y>12);
  if(calm)return;
  const p=Math.min(1,y/(innerHeight*.7));
  tilt.style.setProperty('--rx',(10-8*p+mY*-4).toFixed(2)+'deg');
  tilt.style.setProperty('--ry',(-14+10*p+mX*6).toFixed(2)+'deg');
  $$('.fl').forEach(f=>{const d=+f.dataset.depth;f.style.setProperty('--fx',(mX*d*.9).toFixed(2)+'rem');f.style.setProperty('--fy',(mY*d*.9-p*d*1.2).toFixed(2)+'rem')});
  $$('[data-par]').forEach(el=>{const r=el.parentElement.getBoundingClientRect();const off=(r.top+r.height/2-innerHeight/2)/16*+el.dataset.par;el.style.transform=`translate3d(0,${off.toFixed(2)}rem,0)`});
}
const req=()=>{if(!tick){tick=true;requestAnimationFrame(frame)}};
addEventListener('scroll',req,{passive:true});
$('#hero').addEventListener('pointermove',e=>{mX=e.clientX/innerWidth-.5;mY=e.clientY/innerHeight-.5;req()});
$('#hero').addEventListener('pointerleave',()=>{mX=mY=0;req()});

document.documentElement.classList.add('js');
function countUp(el){const n=+el.dataset.count;if(calm){el.textContent=n;return}let s=null;const step=ts=>{s=s||ts;const k=Math.min(1,(ts-s)/900);el.textContent=Math.round(n*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step)};el.textContent=0;requestAnimationFrame(step)}
if('IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){en.target.classList.add('in');$$('[data-count]',en.target).forEach(countUp);io.unobserve(en.target)}}),{threshold:.12,rootMargin:'0% 0% -6% 0%'});
  $$('.rv').forEach(e=>io.observe(e));
}else $$('.rv').forEach(e=>e.classList.add('in'));


/* garage line-art background (original drawing, SVG user units) */
(function(){
  const car=`<path d="M8 62V46q2-8 22-12l32-4 22-20q4-4 12-4h54q10 0 16 6l20 20 20 6q8 2 8 12v12h-24a18 18 0 0 0-36 0H70a18 18 0 0 0-36 0z"/><path d="M70 30l18-18h30v18zM124 12h26l22 18h-48z"/>`;
  const wheels=`<g class="wh"><circle cx="52" cy="62" r="13"/><path d="M52 49v26M39 62h26"/></g><g class="wh"><circle cx="172" cy="62" r="13"/><path d="M172 49v26M159 62h26"/></g>`;
  const L=t=>[260-260*t,200-140*t], R=t=>[1180+260*t,200-140*t];
  let h='';
  h+=`<path d="M260 200H1180V470H260zM260 200L0 60M1180 200L1440 60M260 470L0 720M1180 470L1440 720"/>`;
  [.22,.5,.85].forEach(t=>{const a=L(t),b=R(t);h+=`<path d="M${a[0]} ${a[1]}H${b[0]}"/><path class="thin" d="M${a[0]} ${a[1]+26}H${b[0]}"/>`;
    let z=`M${a[0]} ${a[1]+26}`;const n=14,w=(b[0]-a[0])/n;for(let i=1;i<=n;i++)z+=`L${(a[0]+w*i).toFixed(0)} ${a[1]+(i%2?0:26)}`;h+=`<path class="thin" d="${z}"/>`});
  [[470,150,610],[830,150,970],[380,96,560],[880,96,1060]].forEach(l=>h+=`<path class="lamp" d="M${l[0]} ${l[1]}H${l[2]}"/>`);
  [400,560,720,880,1040].forEach(x=>h+=`<path class="thin" d="M${x} 470L${(720+(x-720)*4.667).toFixed(0)} 800"/>`);
  [506,560,650].forEach(y=>{const k=(y-470)/250;h+=`<path class="thin" d="M${(260-260*k).toFixed(0)} ${y}H${(1180+260*k).toFixed(0)}"/>`});
  h+=`<path d="M330 290H520V470M330 290V470"/><g class="door"><path class="thin" d="M330 320H520M330 350H520M330 380H520M330 410H520M330 440H520"/></g>`;
  h+=`<path d="M620 270H820V470M620 270V470M620 320H820M620 370H820M620 420H820M687 270V470M753 270V470"/>`;
  h+=`<path d="M920 290H1110V470M920 290V470"/><path class="thin" d="M920 320H1110M920 350H1110M920 380H1110M920 410H1110M920 440H1110"/>`;
  h+=`<path d="M398 286h16v276h-16zM626 286h16v276h-16zM390 562h32M618 562h32M414 286H626"/>`;
  h+=`<g class="up"><path d="M414 538H626M414 532v12M626 532v12"/><g transform="translate(410 458)">${car}${wheels}</g></g>`;
  h+=`<path class="thin" d="M968 340h9v132h-9zM1090 340h9v132h-9zM977 340H1090M977 452H1090"/>`;
  h+=`<g class="roll"><g transform="translate(880 520) scale(1.300)">${car}${wheels}</g></g>`;
  h+=`<path d="M1250 590h70v70h-70zM1250 612h70M1250 634h70M1262 660v14M1308 660v14"/>`;
  h+=`<ellipse cx="150" cy="676" rx="44" ry="13"/><ellipse cx="150" cy="652" rx="44" ry="13"/><ellipse cx="150" cy="628" rx="44" ry="13"/><path d="M106 628v48M194 628v48"/>`;
  const g=document.getElementById('garage'); g.innerHTML=h;
  g.querySelectorAll('path,ellipse,circle').forEach((e,i)=>{if(e.closest('.wh')||e.classList.contains('lamp'))return;e.setAttribute('pathLength','1');e.classList.add('dr');e.style.animationDelay=(i*.045).toFixed(2)+'s'});
  const box=g.parentElement;
  if('IntersectionObserver' in window){const o=new IntersectionObserver(es=>{if(es[0].isIntersecting){box.classList.add('in');o.disconnect()}},{threshold:.15});o.observe(box)}else box.classList.add('in');
})();

let saved=null;try{saved=localStorage.getItem('dg-lang')}catch(e){}
setLang(I[saved]?saved:'th'); frame();

/* ============ menu of phones and tablets (DriveGo's addition, owner 2026-11-18) ============ */
/* The section links, sign-in and the demo button behind one button where the top bar has no room for them. */
(function(){
  const nav=$('#nav'),b=$('#menuB'),p=$('#menuP');
  const open=o=>{p.hidden=!o;b.setAttribute('aria-expanded',String(o));nav.classList.toggle('open',o)};
  b.addEventListener('click',()=>open(p.hidden));
  p.addEventListener('click',e=>{if(e.target.closest('a'))open(false)});
  document.addEventListener('click',e=>{if(!p.hidden&&!nav.contains(e.target))open(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!p.hidden){open(false);b.focus()}});
  matchMedia('(min-width:68rem)').addEventListener('change',e=>{if(e.matches)open(false)});
  // The menu's own language switch (the smallest phones; the top bar's one is wired above).
  $('#menuP .lang').addEventListener('click',e=>{const x=e.target.closest('button');if(x)setLang(x.dataset.lang)});
})();

/* ============ demo request by e-mail or on LINE (DriveGo's addition, owner 2026-11-18) ============ */
/* The e-mail button opens the visitor's own mail app with the summary written in; the LINE button copies the summary
   and opens LINE Official. */
function mailTo(){const s=$('#sum').textContent;$('#mailB').href='mailto:sales@drivegox.com?subject='+encodeURIComponent(s.split('\n')[0])+'&body='+encodeURIComponent(s)}
$('#lineB').addEventListener('click',()=>{try{navigator.clipboard.writeText($('#sum').textContent).catch(()=>{})}catch(x){}});
})();
