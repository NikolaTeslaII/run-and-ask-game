const QUIZ_DATA = [
  {q:"Sự kiện nào đánh dấu thực dân Pháp bắt đầu xâm lược Việt Nam?", a:["Nổ súng vào Đà Nẵng (1858)","Tấn công Gia Định","Ký hiệp ước Nhâm Tuất","Tấn công kinh thành Huế"], correct:0, cat:"Lịch sử 11"},
  {q:"Đạo hàm của hàm số y = x³ là?", a:["3x²","x²","3x³","2x²"], correct:0, cat:"Toán 11"},
  {q:"Đơn vị của cảm ứng từ B là?", a:["Tesla (T)","Vene (Wb)","Ampe (A)","Vôn (V)"], correct:0, cat:"Vật lý 11"},
  {q:"Nhân vật chính trong 'Chữ người tử tù' là?", a:["Huấn Cao","Viên quản ngục","Thơ lại","Chí Phèo"], correct:0, cat:"Ngữ văn 11"},
  {q:"Giới hạn của (2n+1)/(n-3) khi n tiến tới vô cùng là?", a:["2","1","3","0"], correct:0, cat:"Toán 11"},
  {q:"Ký hiệu hóa học của Vàng là?", a:["Au","Ag","Fe","Cu"], correct:0, cat:"Khoa học"},
  {q:"Phản ứng đặc trưng của Hidrocacbon no (Ankan) là?", a:["Phản ứng thế","Phản ứng cộng","Phản ứng trùng hợp","Phản ứng cháy"], correct:0, cat:"Hóa học 11"},
  {q:"Bộ phim James Bond đầu tiên ra mắt năm nào?", a:["1962","1953","1971","1980"], correct:0, cat:"Phim ảnh"},
  {q:"Đạo hàm của hàm số y = tan(x) là?", a:["1/cos²x","-1/cos²x","1/sin²x","cotx"], correct:0, cat:"Toán 11"},
  {q:"Hệ mặt trời có bao nhiêu hành tinh?", a:["8","9","7","10"], correct:0, cat:"Khoa học"},
  {q:"Tên của con tàu đã chìm năm 1912 là?", a:["Titanic","Olympic","Britannic","Lusitania"], correct:0, cat:"Lịch sử"},
  {q:"Năm nào Thế chiến thứ nhất kết thúc?", a:["1918","1914","1945","1939"], correct:0, cat:"Lịch sử"},
  {q:"Tác giả của tiểu thuyết 'Sherlock Holmes' là ai?", a:["Arthur Conan Doyle","Agatha Christie","J.K. Rowling","Victor Hugo"], correct:0, cat:"Văn học"},
  {q:"Thành phố nào thành lập trường đại học đầu tiên (Bologna)?", a:["Ý","Pháp","Anh","Đức"], correct:0, cat:"Lịch sử"},
  {q:"Hành tinh nào gần Mặt trời nhất?", a:["Sao Thủy","Sao Kim","Trái Đất","Sao Hỏa"], correct:0, cat:"Khoa học"},
  {q:"Cơ quan lớn nhất trong cơ thể con người là?", a:["Da","Gan","Phổi","Tim"], correct:0, cat:"Sinh học"},
  {q:"Suất điện động cảm ứng xuất hiện trong mạch khi có sự biến thiên của?", a:["Từ thông","Điện áp","Cường độ dòng điện","Điện trở"], correct:0, cat:"Vật lý 11"},
  {q:"Loài vật nào là biểu tượng của nước Úc?", a:["Kangaroo","Gấu Koala","Đà điểu Emu","Thú mỏ vịt"], correct:0, cat:"Thiên nhiên"},
  {q:"Ai là tác giả của bài thơ 'Vội Vàng'?", a:["Xuân Diệu","Huy Cận","Hàn Mặc Tử","Chế Lan Viên"], correct:0, cat:"Ngữ văn 11"},
  {q:"Ai là người vẽ bức tranh Mona Lisa?", a:["Leonardo da Vinci","Pablo Picasso","Vincent van Gogh","Claude Monet"], correct:0, cat:"Nghệ thuật"},
  {q:"Thấu kính hội tụ luôn cho ảnh ảo khi vật đặt ở?", a:["Trong khoảng tiêu cự","Tại tiêu điểm","Ngoài khoảng tiêu cự","Tại quang tâm"], correct:0, cat:"Vật lý 11"},
  {q:"Quốc gia nào tặng Tượng Nữ Thần Tự Do cho Mỹ?", a:["Pháp","Anh","Đức","Ý"], correct:0, cat:"Lịch sử"},
  {q:"Đại dương nào lớn nhất thế giới?", a:["Thái Bình Dương","Đại Tây Dương","Ấn Độ Dương","Bắc Băng Dương"], correct:0, cat:"Địa lý"},
  {q:"Loài chim nào nhỏ nhất thế giới?", a:["Chim ruồi","Chim sẻ","Chim ưng","Chim bồ câu"], correct:0, cat:"Thiên nhiên"},
  {q:"Quốc gia nào có nhiều múi giờ nhất thế giới?", a:["Pháp","Nga","Mỹ","Trung Quốc"], correct:0, cat:"Địa lý"},
  {q:"Số cạnh của một hình lăng trụ tam giác là?", a:["9","6","5","12"], correct:0, cat:"Toán 11"},
  {q:"Đỉnh núi cao nhất thế giới Everest nằm giữa biên giới hai quốc gia nào?", a:["Nepal và Trung Quốc","Ấn Độ và Trung Quốc","Bhutan và Nepal","Pakistan và Trung Quốc"], correct:0, cat:"Địa lý"},
  {q:"Hợp chất nào sau đây là Ancol?", a:["C2H5OH","CH3COOH","HCHO","CH3OCH3"], correct:0, cat:"Hóa học 11"},
  {q:"Hiện tượng khúc xạ ánh sáng là hiện tượng ánh sáng bị ____ khi đi qua mặt phân cách hai môi trường.", a:["Gãy khúc","Phản xạ","Hấp thụ","Tán sắc"], correct:0, cat:"Vật lý 11"},
  {q:"Ai là người phát minh ra bóng điện?", a:["Thomas Edison","Nikola Tesla","Alexander Bell","Albert Einstein"], correct:0, cat:"Khoa học"},
  {q:"Hiệp hội các quốc gia Đông Nam Á (ASEAN) thành lập năm nào?", a:["1967","1975","1995","1945"], correct:0, cat:"Địa lý 11"},
  {q:"Đất nước nào là quê hương của vũ điệu Samba?", a:["Brazil","Mexico","Tây Ban Nha","Argentina"], correct:0, cat:"Văn hóa"},
  {q:"Thành phố nào được mệnh danh là 'Thành phố Ánh sáng'?", a:["Paris","New York","Las Vegas","Tokyo"], correct:0, cat:"Thế giới"},
  {q:"Mona Lisa không có bộ phận nào trên mặt?", a:["Lông mày","Mi mắt","Môi","Mũi"], correct:0, cat:"Kiến thức thú vị"},
  {q:"Tên thật của Hodor trong Game of Thrones là gì?", a:["Wylis","Hodor","Walder","Wilfred"], correct:0, cat:"Phim ảnh"},
  {q:"Hành tinh nào được gọi là 'Hành tinh Đỏ'?", a:["Sao Hỏa","Sao Kim","Sao Thổ","Sao Mộc"], correct:0, cat:"Khoa học"},
  {q:"Quốc gia nào có diện tích lớn nhất khu vực Đông Nam Á?", a:["Indonesia","Việt Nam","Thái Lan","Philippines"], correct:0, cat:"Địa lý 11"},
  {q:"Bài thơ 'Đây thôn Vĩ Dạ' gợi nhớ về vùng đất nào?", a:["Huế","Đà Lạt","Hà Nội","Quảng Nam"], correct:0, cat:"Ngữ văn 11"},
  {q:"Cho hình chóp S.ABCD có đáy ABCD là hình vuông. Đường thẳng nào vuông góc với mặt phẳng (ABCD)?", a:["SA (nếu SA⊥đáy)","SB","SC","SD"], correct:0, cat:"Toán 11"},
  {q:"Con sông dài nhất thế giới là?", a:["Sông Nile","Sông Amazon","Sông Mê Kông","Sông Mississippi"], correct:0, cat:"Thế giới"},
  {q:"Thủ đô của nước Pháp là?", a:["Paris","London","Berlin","Madrid"], correct:0, cat:"Địa lý"},
  {q:"Ai là người đầu tiên đặt chân lên Mặt Trăng?", a:["Neil Armstrong","Yuri Gagarin","Buzz Aldrin","Elon Musk"], correct:0, cat:"Lịch sử"},
  {q:"Công thức của Benzen là?", a:["C6H6","C6H12","C7H8","C2H2"], correct:0, cat:"Hóa học 11"},

];

let parsedCustomQ = null;

function loadCustomQuestions() {
    try {
        const customQ = localStorage.getItem('httt_custom_q');
        if (customQ) {
            const parsed = JSON.parse(customQ);
            if (Array.isArray(parsed) && parsed.length > 0) {
                parsedCustomQ = parsed;
                return;
            }
        }
    } catch(e) {}
    parsedCustomQ = null; // fallback
}

// Gọi khi khởi động hoặc sau khi lưu custom room
loadCustomQuestions();

function getRandomQuestion() {
    const dataSource = parsedCustomQ || QUIZ_DATA;
    return dataSource[Math.floor(Math.random() * dataSource.length)];
}
