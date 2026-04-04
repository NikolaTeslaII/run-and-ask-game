import random
import json

def generate_questions():
    all_q = []
    
    # ── CATEGORIES ──
    # [Sports, Economy, Literature, Cinema, Astronomy, Animals, Inventions, 
    #  Mythology, Cuisine, Architecture, Language, Music, Engineering, Fashion, 
    #  Environment, IT, Math11, Phys11, Chem11, Bio11, Lit11]

    raw_data = [
        # Thể thao
        {"q":"Đội tuyển quốc gia nào vô địch FIFA World Cup 2022?","a":["Argentina","Pháp","Brazil","Tây Ban Nha"],"c":0,"cat":"Thể thao"},
        {"q":"Biểu tượng của Thế vận hội (Olympic) bao gồm bao nhiêu vòng tròn đan vào nhau?","a":["5","4","6","7"],"c":0,"cat":"Thể thao"},
        {"q":"Môn quần vợt (Tennis) có bao nhiêu giải Grand Slam trong một năm?","a":["4","2","3","5"],"c":0,"cat":"Thể thao"},
        {"q":"Môn võ Judo có nguồn gốc từ quốc gia nào?","a":["Nhật Bản","Trung Quốc","Hàn Quốc","Thái Lan"],"c":0,"cat":"Thể thao"},
        {"q":"Chiều dài tiêu chuẩn của một đường chạy Marathon là bao nhiêu?","a":["42,195 km","40 km","45 km","50 km"],"c":0,"cat":"Thể thao"},
        {"q":"Trong môn bóng rổ, mỗi đội có bao nhiêu cầu thủ thi đấu chính thức trên sân?","a":["5","6","7","11"],"c":0,"cat":"Thể thao"},
        {"q":"Michael Phelps là huyền thoại trong môn thể thao nào?","a":["Bơi lội","Điền kinh","Thể dục dụng cụ","Cử tạ"],"c":0,"cat":"Thể thao"},
        {"q":"Thuật ngữ 'Hole-in-one' được sử dụng trong môn thể thao nào?","a":["Golf","Billiards","Bóng chày","Bowling"],"c":0,"cat":"Thể thao"},
        {"q":"Đội bóng đá nào có biệt danh là 'Quỷ đỏ' (The Red Devils)?","a":["Manchester United","AC Milan","Bayern Munich","Liverpool"],"c":0,"cat":"Thể thao"},
        {"q":"Môn thể thao vua là tên gọi khác của môn nào?","a":["Bóng đá","Bóng bầu dục","Điền kinh","Bóng rổ"],"c":0,"cat":"Thể thao"},

        # Kinh tế & Kinh doanh
        {"q":"Đơn vị tiền tệ chính thức của Nhật Bản là gì?","a":["Yên","Won","Nhân dân tệ","Baht"],"c":0,"cat":"Kinh tế"},
        {"q":"Ai là người sáng lập ra tập đoàn thương mại điện tử Amazon?","a":["Jeff Bezos","Elon Musk","Mark Zuckerberg","Bill Gates"],"c":0,"cat":"Kinh tế"},
        {"q":"Chỉ số GDP trong kinh tế học là viết tắt của cụm từ nào?","a":["Tổng sản phẩm quốc nội","Tổng thu nhập quốc dân","Tổng dự trữ quốc gia","Tổng sản lượng công nghiệp"],"c":0,"cat":"Kinh tế"},
        {"q":"Phố Wall - trung tâm tài chính lớn nhất thế giới nằm ở thành phố nào?","a":["New York","London","Tokyo","Paris"],"c":0,"cat":"Kinh tế"},
        {"q":"Adam Smith thường được mệnh danh là cha đẻ của lĩnh vực nào?","a":["Kinh tế học hiện đại","Kế toán","Quản trị kinh doanh","Tiếp thị"],"c":0,"cat":"Kinh tế"},
        {"q":"Đồng tiền mã hóa Bitcoin được tạo ra vào năm nào?","a":["2009","2005","2012","2015"],"c":0,"cat":"Kinh tế"},
        {"q":"Tạp chí kinh doanh nổi tiếng chuyên công bố danh sách tỷ phú thế giới là?","a":["Forbes","Time","Vogue","National Geographic"],"c":0,"cat":"Kinh tế"},
        {"q":"Tình trạng thị trường chỉ có một người bán duy nhất cung cấp sản phẩm/dịch vụ gọi là gì?","a":["Độc quyền","Cạnh tranh hoàn hảo","Thiểu số độc quyền","Lạm phát"],"c":0,"cat":"Kinh tế"},
        {"q":"Tổ chức IMF là viết tắt của cơ quan nào?","a":["Quỹ Tiền tệ Quốc tế","Ngân hàng Thế giới","Tổ chức Y tế Thế giới","Tổ chức Thương mại Thế giới"],"c":0,"cat":"Kinh tế"},
        {"q":"Ngân hàng trung ương của Hoa Kỳ có tên là gì?","a":["FED (Cục Dự trữ Liên bang)","Bank of America","Ngân hàng Thế giới","IMF"],"c":0,"cat":"Kinh tế"},

        # Văn học Thế giới
        {"q":"Vở bi kịch 'Romeo và Juliet' là sáng tác của nhà văn nào?","a":["William Shakespeare","Victor Hugo","Charles Dickens","Mark Twain"],"c":0,"cat":"Văn học"},
        {"q":"Ai là tác giả của loạt tiểu thuyết viễn tưởng 'Harry Potter'?","a":["J.K. Rowling","J.R.R. Tolkien","C.S. Lewis","George R.R. Martin"],"c":0,"cat":"Văn học"},
        {"q":"Tác phẩm 'Đôn Ki-hô-tê' (Don Quixote) xuất xứ từ quốc gia nào?","a":["Tây Ban Nha","Pháp","Ý","Bồ Đào Nha"],"c":0,"cat":"Văn học"},
        {"q":"Nhạc sĩ nào đã giành giải Nobel Văn học năm 2016?","a":["Bob Dylan","John Lennon","Paul McCartney","Elton John"],"c":0,"cat":"Văn học"},
        {"q":"Thơ Haiku là thể loại thơ truyền thống của nước nào?","a":["Nhật Bản","Trung Quốc","Hàn Quốc","Ấn Độ"],"c":0,"cat":"Văn học"},
        {"q":"'Hoàng tử bé' (Le Petit Prince) được viết bằng ngôn ngữ gốc là gì?","a":["Tiếng Pháp","Tiếng Anh","Tiếng Đức","Tiếng Tây Ban Nha"],"c":0,"cat":"Văn học"},
        {"q":"Nhà văn Gabriel García Márquez nổi tiếng với tác phẩm nào?","a":["Trăm năm cô đơn","Tiếng chim hót trong bụi mận gai","Cuốn theo chiều gió","Không gia đình"],"c":0,"cat":"Văn học"},
        {"q":"Ai là cha đẻ của nhân vật thám tử Sherlock Holmes?","a":["Arthur Conan Doyle","Agatha Christie","Dan Brown","Stephen King"],"c":0,"cat":"Văn học"},
        {"q":"Tác phẩm 'Những người khốn khổ' (Les Misérables) do ai sáng tác?","a":["Victor Hugo","Alexandre Dumas","Balzac","Molière"],"c":0,"cat":"Văn học"},
        {"q":"Lev Tolstoy là tác giả của tiểu thuyết sử thi nào?","a":["Chiến tranh và hòa bình","Tội ác và hình phạt","Anh em nhà Karamazov","AQ chính truyện"],"c":0,"cat":"Văn học"},

        # Điện ảnh & Giải trí
        {"q":"Bộ phim có doanh thu phòng vé cao nhất lịch sử (đến 2023) là?","a":["Avatar","Avengers: Endgame","Titanic","Star Wars"],"c":0,"cat":"Điện ảnh"},
        {"q":"Ai là người tạo ra nhân vật hoạt hình Chuột Mickey?","a":["Walt Disney","Stan Lee","Hayao Miyazaki","Charles Schulz"],"c":0,"cat":"Điện ảnh"},
        {"q":"Đặc vụ hư cấu James Bond có bí danh là gì?","a":["007","001","101","47"],"c":0,"cat":"Điện ảnh"},
        {"q":"Giải thưởng Grammy được trao cho lĩnh vực nào?","a":["Âm nhạc","Điện ảnh","Truyền hình","Sân khấu"],"c":0,"cat":"Âm nhạc"},
        {"q":"Bộ phim hoạt hình feature-length đầu tiên của Disney là?","a":["Bạch Tuyết và Bảy chú lùn","Pinocchio","Dumbo","Lọ Lem"],"c":0,"cat":"Điện ảnh"},
        {"q":"K-pop là nền công nghiệp âm nhạc của quốc gia nào?","a":["Hàn Quốc","Triều Tiên","Nhật Bản","Trung Quốc"],"c":0,"cat":"Âm nhạc"},
        {"q":"Kinh đô điện ảnh Hollywood nằm ở tiểu bang nào của Mỹ?","a":["California","New York","Texas","Florida"],"c":0,"cat":"Điện ảnh"},
        {"q":"Đạo diễn của siêu phẩm điện ảnh Titanic (1997) là ai?","a":["James Cameron","Steven Spielberg","Christopher Nolan","Martin Scorsese"],"c":0,"cat":"Điện ảnh"},
        {"q":"Tên nhân vật chính do Keanu Reeves thủ vai trong The Matrix là gì?","a":["Neo","Morpheus","Trinity","Smith"],"c":0,"cat":"Điện ảnh"},
        {"q":"Lễ hội thảm đỏ LHP Cannes được tổ chức hàng năm tại quốc gia nào?","a":["Pháp","Ý","Đức","Anh"],"c":0,"cat":"Điện ảnh"},

        # Thiên văn học
        {"q":"Hành tinh nào lớn nhất trong Hệ Mặt Trời?","a":["Sao Mộc","Sao Thổ","Sao Thiên Vương","Sao Hải Vương"],"c":0,"cat":"Thiên văn"},
        {"q":"Ai là người đầu tiên bay vào không gian?","a":["Yuri Gagarin","Neil Armstrong","Buzz Aldrin","John Glenn"],"c":0,"cat":"Thiên văn"},
        {"q":"Dải ngân hà chứa Trái Đất thuộc phân loại thiên hà nào?","a":["Thiên hà xoắn ốc","Thiên hà elip","Thiên hà dị thường","Thiên hà thấu kính"],"c":0,"cat":"Thiên văn"},
        {"q":"Ngôi sao nào nằm gần Trái Đất nhất?","a":["Mặt Trời","Alpha Centauri","Sirius","Proxima Centauri"],"c":0,"cat":"Thiên văn"},
        {"q":"Hành tinh nào thường được mệnh danh là 'Hành tinh đỏ'?","a":["Sao Hỏa","Sao Kim","Sao Thủy","Sao Mộc"],"c":0,"cat":"Thiên văn"},
        {"q":"Năm 2006, thiên thể nào bị giáng cấp xuống thành 'hành tinh lùn'?","a":["Sao Diêm Vương (Pluto)","Sao Hải Vương","Ceres","Eris"],"c":0,"cat":"Thiên văn"},
        {"q":"Kính viễn vọng không gian nổi tiếng mang tên nhà thiên văn nào?","a":["Hubble","Galileo","Kepler","Newton"],"c":0,"cat":"Thiên văn"},
        {"q":"Chu kỳ quay quanh Mặt Trời của Trái Đất xấp xỉ bao nhiêu ngày?","a":["365,25","360","364","366"],"c":0,"cat":"Thiên văn"},
        {"q":"Sao chổi Halley xuất hiện gần Trái Đất khoảng bao nhiêu năm một lần?","a":["76 năm","50 năm","65 năm","100 năm"],"c":0,"cat":"Thiên văn"},
        {"q":"Thiên thạch khi bốc cháy trong bầu khí quyển được gọi là gì?","a":["Sao băng","Sao chổi","Tiểu hành tinh","Lỗ đen"],"c":0,"cat":"Thiên văn"},

        # Động vật & Thực vật
        {"q":"Loài động vật trên cạn nào chạy nhanh nhất?","a":["Báo săn (Cheetah)","Ngựa","Báo hoa mai","Báo đốm"],"c":0,"cat":"Thiên nhiên"},
        {"q":"Loài động vật trên cạn nào cao nhất thế giới?","a":["Hươu cao cổ","Voi","Lạc đà","Đà điểu"],"c":0,"cat":"Thiên nhiên"},
        {"q":"Về mặt sinh học, cây tre thuộc họ thực vật nào?","a":["Họ Cỏ (Hòa thảo)","Họ Cây gỗ","Họ Cọ","Họ Dương xỉ"],"c":0,"cat":"Thiên nhiên"},
        {"q":"Chim cánh cụt sinh sống tự nhiên chủ yếu ở khu vực nào?","a":["Nam Cực","Bắc Cực","Greenland","Iceland"],"c":0,"cat":"Thiên nhiên"},
        {"q":"Quốc hoa của Việt Nam là loài hoa nào?","a":["Hoa sen","Hoa hồng","Hoa mai","Hoa đào"],"c":0,"cat":"Văn hóa"},
        {"q":"Thú có túi (Kangaroo, Koala) phân bố tự nhiên tập trung ở đâu?","a":["Châu Úc","Châu Phi","Nam Mỹ","Đông Nam Á"],"c":0,"cat":"Thiên nhiên"},
        {"q":"Loài hoa lớn nhất thế giới có tên là gì?","a":["Hoa Rafflesia","Hoa Hướng dương","Hoa Titan Arum","Hoa Súng nia"],"c":0,"cat":"Thiên nhiên"},
        {"q":"Loài côn trùng có tuổi thọ trưởng thành ngắn nhất (khoảng 24 giờ)?","a":["Phù du","Ruồi","Muỗi","Ve sầu"],"c":0,"cat":"Thiên nhiên"},
        {"q":"Quá trình thực vật tự tổng hợp thức ăn nhờ ánh sáng gọi là gì?","a":["Quang hợp","Hô hấp","Bài tiết","Lên men"],"c":0,"cat":"Sinh học"},
        {"q":"Loài động vật có vú duy nhất biết bay là?","a":["Dơi","Sóc bay","Chim đà điểu","Cú mèo"],"c":0,"cat":"Thiên nhiên"},

        # Khám phá & Phát minh
        {"q":"Ai là người tìm ra loại thuốc kháng sinh đầu tiên (Penicillin)?","a":["Alexander Fleming","Louis Pasteur","Marie Curie","Robert Koch"],"c":0,"cat":"Khoa học"},
        {"q":"Alexander Graham Bell được cấp bằng sáng chế cho phát minh nào?","a":["Điện thoại","Bóng đèn","Điện tín","Radio"],"c":0,"cat":"Công nghệ"},
        {"q":"Anh em nhà Wright ghi danh vào lịch sử với phát minh nào?","a":["Máy bay","Tàu ngầm","Tàu hỏa","Ô tô"],"c":0,"cat":"Công nghệ"},
        {"q":"Marie Curie nổi tiếng với việc khám phá ra nguyên tố vô tuyến nào?","a":["Radium & Polonium","Uranium & Plutonium","Carbon & Oxy","Vàng & Bạc"],"c":0,"cat":"Khoa học"},
        {"q":"Ai là người sáng chế ra World Wide Web (WWW)?","a":["Tim Berners-Lee","Bill Gates","Steve Jobs","Mark Zuckerberg"],"c":0,"cat":"Công nghệ"},
        {"q":"Nhà phát minh nào là cha đẻ của dòng điện xoay chiều (AC)?","a":["Nikola Tesla","Thomas Edison","Michael Faraday","James Watt"],"c":0,"cat":"Công nghệ"},
        {"q":"Máy in chữ rời được phát minh bởi ai?","a":["Johannes Gutenberg","Leonardo da Vinci","Galileo Galilei","Isaac Newton"],"c":0,"cat":"Công nghệ"},
        {"q":"Giai thoại về quả táo rụng liên quan đến việc khám phá ra định luật gì?","a":["Lực vạn vật hấp dẫn","Thuyết tương đối","Định luật bảo toàn","Lực đẩy Archimedes"],"c":0,"cat":"Khoa học"},
        {"q":"Ai phát minh ra thuốc nổ và lập ra giải thưởng Nobel?","a":["Alfred Nobel","Albert Einstein","Oppenheimer","Antoine Lavoisier"],"c":0,"cat":"Khoa học"},
        {"q":"Động cơ hơi nước được hoàn thiện bởi?","a":["James Watt","George Stephenson","Henry Ford","Karl Benz"],"c":0,"cat":"Công nghệ"},

        # Tâm lý & Triết học
        {"q":"Sigmund Freud là cha đẻ của trường phái tâm lý học nào?","a":["Phân tâm học","Tâm lý học hành vi","Tâm lý học nhận thức","Tâm lý học nhân văn"],"c":0,"cat":"Tâm lý"},
        {"q":"Ai tác giả câu nói: 'Tôi tư duy, nên tôi tồn tại' (Cogito, ergo sum)?","a":["René Descartes","Aristotle","Socrates","Immanuel Kant"],"c":0,"cat":"Triết học"},
        {"q":"Tháp nhu cầu mang tên nhà tâm lý học nào?","a":["Abraham Maslow","Carl Jung","Ivan Pavlov","B.F. Skinner"],"c":0,"cat":"Tâm lý"},
        {"q":"Triết gia Hy Lạp là học trò Socrates và là thầy Aristotle?","a":["Plato","Pythagoras","Epicurus","Diogenes"],"c":0,"cat":"Triết học"},
        {"q":"Hiệu ứng tin vào lời tiên tri chung chung dành riêng cho mình?","a":["Hiệu ứng Barnum (Forer)","Hiệu ứng Dunning-Kruger","Hiệu ứng Mandela","Hiệu ứng Halo"],"c":0,"cat":"Tâm lý"},
        {"q":"Ai là người sáng lập Đạo giáo và tác giả 'Đạo Đức Kinh'?","a":["Lão Tử","Khổng Tử","Trang Tử","Mạnh Tử"],"c":0,"cat":"Triết học"},
        {"q":"Thuật ngữ 'IQ' là viết tắt của cụm từ nào?","a":["Intelligence Quotient","Internal Quotient","Intellectual Quantity","Insight Quotient"],"c":0,"cat":"Tâm lý"},
        {"q":"Nhà khoa học nổi tiếng với thí nghiệm phản xạ có điều kiện trên chó?","a":["Ivan Pavlov","John B. Watson","Albert Bandura","Jean Piaget"],"c":0,"cat":"Tâm lý"},
        {"q":"Căn bệnh ám ảnh sợ không gian hẹp là gì?","a":["Claustrophobia","Agoraphobia","Arachnophobia","Trypophobia"],"c":0,"cat":"Tâm lý"},
        {"q":"Chủ nghĩa Khắc kỷ (Stoicism) hình thành ở nền văn minh nào?","a":["Hy Lạp","Ai Cập","Ấn Độ","Lưỡng Hà"],"c":0,"cat":"Triết học"},

        # Thần thoại & Truyền thuyết
        {"q":"Vị thần tối cao cai quản đỉnh Olympus là ai?","a":["Zeus","Poseidon","Hades","Apollo"],"c":0,"cat":"Thần thoại"},
        {"q":"Vị thần sấm sét sử dụng cây búa Mjölnir là?","a":["Thor","Odin","Loki","Balder"],"c":0,"cat":"Thần thoại"},
        {"q":"Thần chết Anubis có chiếc đầu của loài vật nào?","a":["Chó rừng","Chim ưng","Cá sấu","Sư tử"],"c":0,"cat":"Thần thoại"},
        {"q":"Quái vật Minotaur có hình dáng nửa người nửa con gì?","a":["Bò tót","Ngựa","Rắn","Dê"],"c":0,"cat":"Thần thoại"},
        {"q":"Thanh gươm huyền thoại của Vua Arthur tên là gì?","a":["Excalibur","Durendal","Masamune","Kusanagi"],"c":0,"cat":"Thần thoại"},
        {"q":"Ai đã đánh cắp ngọn lửa từ các vị thần Olympus trao cho nhân loại?","a":["Prometheus","Hercules","Perseus","Achilles"],"c":0,"cat":"Thần thoại"},
        {"q":"Nữ thần tình yêu và sắc đẹp trong thần thoại La Mã?","a":["Venus","Athena","Hera","Artemis"],"c":0,"cat":"Thần thoại"},
        {"q":"Cửu Vĩ Hồ là sinh vật huyền thoại có hình dáng của loài vật nào?","a":["Cáo","Chó sói","Mèo","Rồng"],"c":0,"cat":"Thần thoại"},
        {"q":"Thành Troy thất thủ bởi vật mô phỏng loài vật nào?","a":["Ngựa gỗ","Bò gỗ","Chim gỗ","Sư tử gỗ"],"c":0,"cat":"Thần thoại"},
        {"q":"Vũ khí đặc trưng của thần biển Poseidon là gì?","a":["Cây đinh ba","Lưỡi hái","Cung tên","Khiên"],"c":0,"cat":"Thần thoại"},

        # Ẩm thực Thế giới
        {"q":"Món ăn truyền thống Sushi có xuất xứ từ quốc gia nào?","a":["Nhật Bản","Hàn Quốc","Trung Quốc","Thái Lan"],"c":0,"cat":"Ẩm thực"},
        {"q":"Bánh Croissant nổi tiếng của Pháp thực chất có nguồn gốc từ?","a":["Áo","Ý","Đức","Bỉ"],"c":0,"cat":"Ẩm thực"},
        {"q":"Kimchi truyền thống thường được lên men từ loại rau củ nào?","a":["Cải thảo","Củ cải trắng","Dưa chuột","Bắp cải"],"c":0,"cat":"Ẩm thực"},
        {"q":"Pizza Margherita có 3 màu tượng trưng cho quốc kỳ nước nào?","a":["Ý","Mexico","Pháp","Tây Ban Nha"],"c":0,"cat":"Ẩm thực"},
        {"q":"Cà phê Espresso bắt nguồn từ quốc gia nào?","a":["Ý","Colombia","Brazil","Mỹ"],"c":0,"cat":"Ẩm thực"},
        {"q":"Phô mai Roquefort của Pháp được làm từ sữa con vật nào?","a":["Cừu","Bò","Dê","Trâu"],"c":0,"cat":"Ẩm thực"},
        {"q":"Tom Yum là món súp chua cay đặc sản của nền ẩm thực nào?","a":["Thái Lan","Malaysia","Indonesia","Lào"],"c":0,"cat":"Ẩm thực"},
        {"q":"Nước mắm truyền thống Việt Nam lên men từ 2 thành phần nào?","a":["Cá & Muối","Tôm & Muối","Mực & Đường","Đậu nành & Muối"],"c":0,"cat":"Ẩm thực"},
        {"q":"Trà sữa trân châu được phát minh đầu tiên ở đâu?","a":["Đài Loan","Hồng Kông","Ma Cao","Trung Quốc"],"c":0,"cat":"Ẩm thực"},
        {"q":"Xúc xích Bratwurst là món ăn biểu tượng của nước nào?","a":["Đức","Anh","Mỹ","Ba Lan"],"c":0,"cat":"Ẩm thực"},

        # Kiến trúc & Điêu khắc
        {"q":"Đấu trường La Mã (Colosseum) nằm ở thành phố nào?","a":["Rome","Athens","Venice","Milan"],"c":0,"cat":"Kiến trúc"},
        {"q":"Tháp Eiffel được khánh thành vào thế kỷ nào?","a":["Thế kỷ 19","Thế kỷ 17","Thế kỷ 18","Thế kỷ 20"],"c":0,"cat":"Kiến trúc"},
        {"q":"Kim tự tháp Giza là di sản văn hóa thuộc quốc gia nào?","a":["Ai Cập","Iran","Iraq","Thổ Nhĩ Kỳ"],"c":0,"cat":"Kiến trúc"},
        {"q":"Đền Taj Mahal ở Ấn Độ xây dựng chủ yếu bằng vật liệu nào?","a":["Đá cẩm thạch trắng","Đá hoa cương","Đất nung","Gỗ gụ"],"c":0,"cat":"Kiến trúc"},
        {"q":"Tháp nghiêng Pisa nằm ở quốc gia nào?","a":["Ý","Pháp","Hy Lạp","Tây Ban Nha"],"c":0,"cat":"Kiến trúc"},
        {"q":"Kiến trúc Gothic nổi bật với đặc điểm nào?","a":["Vòm nhọn, cửa kính màu lớn","Mái vòm tròn, tường dày","Cột Hy Lạp cổ điển","Mái bằng"],"c":0,"cat":"Kiến trúc"},
        {"q":"Nhà hát Opera Sydney có thiết kế mái vòm mô phỏng hình ảnh gì?","a":["Vỏ sò / Cánh buồm","Cánh chim","Ngọn sóng","Lá cây"],"c":0,"cat":"Kiến trúc"},
        {"q":"Tượng Nữ thần Tự do là quà tặng của quốc gia nào cho nước Mỹ?","a":["Pháp","Anh","Tây Ban Nha","Đức"],"c":0,"cat":"Kiến trúc"},
        {"q":"Tòa nhà cao nhất thế giới hiện nay (Burj Khalifa) ở đâu?","a":["Dubai","New York","Tokyo","Thượng Hải"],"c":0,"cat":"Kiến trúc"},
        {"q":"Tử Cấm Thành nằm ở thủ đô nào?","a":["Bắc Kinh","Seoul","Tokyo","Bangkok"],"c":0,"cat":"Kiến trúc"},

        # Ngôn ngữ học
        {"q":"Ngôn ngữ có số lượng người bản ngữ đông nhất thế giới?","a":["Tiếng Quan Thoại","Tiếng Anh","Tiếng Tây Ban Nha","Tiếng Hindi"],"c":0,"cat":"Ngôn ngữ"},
        {"q":"Chữ Quốc ngữ Việt Nam dựa trên hệ thống chữ cái nào?","a":["Chữ Latinh","Chữ Cyrillic","Chữ Hán","Chữ Phạn"],"c":0,"cat":"Ngôn ngữ"},
        {"q":"'Esperanto' (Quốc tế ngữ) là loại ngôn ngữ gì?","a":["Ngôn ngữ nhân tạo","Ngôn ngữ người ngoài hành tinh","Ngôn ngữ cổ","Ngôn ngữ lập trình"],"c":0,"cat":"Ngôn ngữ"},
        {"q":"Tiếng Anh thuộc vào ngữ hệ nào?","a":["Ngữ hệ Ấn-Âu","Ngữ hệ Hán-Tạng","Ngữ hệ Nam Á","Ngữ hệ Ural"],"c":0,"cat":"Ngôn ngữ"},
        {"q":"Bảng chữ cái tiếng Anh tiêu chuẩn có bao nhiêu chữ cái?","a":["26","24","25","28"],"c":0,"cat":"Ngôn ngữ"},
        {"q":"'Karaoke' mượn từ tiếng Nhật dịch sát nghĩa là gì?","a":["Dàn nhạc trống không","Hát cùng nhau","Giọng ca vàng","Sân khấu nhỏ"],"c":0,"cat":"Ngôn ngữ"},
        {"q":"Chữ Tượng hình (Hieroglyphics) là của nền văn minh nào?","a":["Ai Cập","Maya","Lưỡng Hà","Indus"],"c":0,"cat":"Lịch sử"},
        {"q":"Từ được tạo bởi 2 âm tiết trở lên trong tiếng Việt gọi là?","a":["Từ ghép (Từ phức)","Từ đơn","Từ láy","Từ mượn"],"c":0,"cat":"Ngôn ngữ"},
        {"q":"'Sayonara' trong tiếng Nhật mang ý nghĩa gì?","a":["Tạm biệt","Xin chào","Xin lỗi","Cảm ơn"],"c":0,"cat":"Ngôn ngữ"},
        {"q":"Ngôn ngữ chính thức tại Brazil là gì?","a":["Tiếng Bồ Đào Nha","Tiếng Tây Ban Nha","Tiếng Anh","Tiếng Pháp"],"c":0,"cat":"Ngôn ngữ"},

        # Âm nhạc
        {"q":"Beethoven đã bị mất đi giác quan nào ở nửa sau cuộc đời?","a":["Thính giác","Thị giác","Vị giác","Khứu giác"],"c":0,"cat":"Âm nhạc"},
        {"q":"'Ông vua nhạc Pop' (King of Pop) thuộc về nghệ sĩ nào?","a":["Michael Jackson","Elvis Presley","Prince","Freddie Mercury"],"c":0,"cat":"Âm nhạc"},
        {"q":"Một cây đàn Piano tiêu chuẩn có bao nhiêu phím?","a":["88","76","80","92"],"c":0,"cat":"Âm nhạc"},
        {"q":"Vở ballet 'Hồ Thiên Nga' là tác phẩm của soạn giả nào?","a":["Tchaikovsky","Mozart","Bach","Chopin"],"c":0,"cat":"Âm nhạc"},
        {"q":"Nhạc cụ Violin luôn có bao nhiêu dây đàn?","a":["4","3","5","6"],"c":0,"cat":"Âm nhạc"},
        {"q":"Ban nhạc huyền thoại ABBA được thành lập tại quốc gia nào?","a":["Thụy Điển","Anh","Mỹ","Đức"],"c":0,"cat":"Âm nhạc"},
        {"q":"Thể loại Jazz có nguồn gốc từ cộng đồng nào ở Hoa Kỳ?","a":["Người Mỹ gốc Phi","Người da đỏ","Người gốc Ireland","Người gốc Tây Ban Nha"],"c":0,"cat":"Âm nhạc"},
        {"q":"Bài hát 'Quốc ca' của Việt Nam có tên gọi gốc là gì?","a":["Tiến quân ca","Đoàn ca","Lên đàng","Chào cờ"],"c":0,"cat":"Văn hóa"},
        {"q":"Nhạc cụ nào mệnh danh là 'nữ hoàng các loại nhạc cụ'?","a":["Violin","Piano","Guitar","Flute"],"c":0,"cat":"Âm nhạc"},
        {"q":"Giải thưởng danh giá nhất cho sân khấu Broadway là giải gì?","a":["Tony","Oscar","Grammy","Emmy"],"c":0,"cat":"Nghệ thuật"},

        # Kỹ thuật & Ô tô
        {"q":"Tập đoàn ô tô Toyota có trụ sở chính tại quốc gia nào?","a":["Nhật Bản","Hàn Quốc","Trung Quốc","Đức"],"c":0,"cat":"Công nghệ"},
        {"q":"Chiếc ô tô đầu tiên chạy bằng động cơ đốt trong cấp bằng sáng chế cho ai?","a":["Karl Benz","Henry Ford","Nikola Tesla","Rudolf Diesel"],"c":0,"cat":"Công nghệ"},
        {"q":"Dòng xe điện Model S, Model 3 là sản phẩm của công ty nào?","a":["Tesla","Ford","BMW","Audi"],"c":0,"cat":"Công nghệ"},
        {"q":"Công nghệ 'ABS' trên ô tô, xe máy là hệ thống gì?","a":["Chống bó cứng phanh","Cân bằng điện tử","Hỗ trợ ngang dốc","Cảnh báo điểm mù"],"c":0,"cat":"Công nghệ"},
        {"q":"Tàu con thoi đầu tiên của NASA bay vào vũ trụ là?","a":["Columbia","Apollo","Challenger","Discovery"],"c":0,"cat":"Khoa học"},
        {"q":"Động cơ đốt trong 4 kỳ hoạt động theo thứ tự nào?","a":["Nạp - Nén - Nổ - Xả","Nén - Nạp - Xả - Nổ","Nổ - Nạp - Nén - Xả","Nạp - Xả - Nén - Nổ"],"c":0,"cat":"Kỹ thuật"},
        {"q":"Hãng siêu xe Ferrari có logo hình ảnh con vật gì?","a":["Ngựa chồm","Bò tót","Báo đốm","Sư tử"],"c":0,"cat":"Thương hiệu"},
        {"q":"Tàu ngầm nổi/chìm dựa theo nguyên lý của ai?","a":["Archimedes","Newton","Pascal","Bernoulli"],"c":0,"cat":"Vật lý"},
        {"q":"Hộp số sàn (số tay) thường viết tắt bằng ký tự nào?","a":["MT","AT","CVT","DCT"],"c":0,"cat":"Công nghệ"},
        {"q":"Kênh đào Panama nối liền hai đại dương nào?","a":["Đại Tây Dương & Thái Bình Dương","Ấn Độ Dương & Thái Bình Dương","Đại Tây Dương & Ấn Độ Dương","Bắc Băng Dương & Đại Tây Dương"],"c":0,"cat":"Địa lý"},

        # Toán 11
        {"q":"Kết quả của $\\lim_{n \\to +\\infty} \\frac{2n - 3}{n + 1}$ là:","a":["2","-3","1","+\\infty"],"c":0,"cat":"Toán 11"},
        {"q":"Đạo hàm của $y = x^3 - 2x^2 + x - 5$ là:","a":["$y' = 3x^2 - 4x + 1$","$y' = x^2 - 4x + 1$","$y' = 3x^2 - 2x + 1$","$y' = 3x^2 - 4x$"],"c":0,"cat":"Toán 11"},
        {"q":"Trong không gian, đường thẳng d vuông góc với mặt phẳng (a), d sẽ:","a":["Vuông góc với mọi đường thẳng trong (a)","Chỉ vuông góc với 2 đường trong (a)","Song song với mọi đường trong (a)","Chỉ vuông góc với 1 đường trong (a)"],"c":0,"cat":"Toán 11"},
        {"q":"Đạo hàm của hàm số $y = \\sin(2x + 1)$ là:","a":["$y' = 2\\cos(2x + 1)$","$y' = \\cos(2x + 1)$","$y' = -2\\cos(2x + 1)$","$y' = \\frac{1}{2}\\cos(2x + 1)$"],"c":0,"cat":"Toán 11"},
        {"q":"Giới hạn $\\lim_{x \\to 1} \\frac{x^2 - 1}{x - 1}$ bằng:","a":["2","0","1","Không tồn tại"],"c":0,"cat":"Toán 11"},
        {"q":"Góc giữa đường thẳng SC và mặt phẳng (ABCD) nếu SA vuông đáy là?","a":["Góc SCA","Góc SCB","Góc SCD","Góc SAC"],"c":0,"cat":"Toán 11"},
        {"q":"Đạo hàm cấp hai của hàm số $y = \\cos x$ là:","a":["$y'' = -\\cos x$","$y'' = \\sin x$","$y'' = -\\sin x$","$y'' = \\cos x$"],"c":0,"cat":"Toán 11"},

        # Vật lý 11
        {"q":"Lực từ tác dụng lên đoạn dây mang điện trong từ trường đều tính bằng?","a":["$F = BIl \\sin \\alpha$","$F = BIl \\cos \\alpha$","$F = qvB \\sin \\alpha$","$F = B \\sin \\alpha$"],"c":0,"cat":"Vật lý 11"},
        {"q":"Đơn vị của từ thông Φ trong hệ SI là gì?","a":["Weber (Wb)","Tesla (T)","Henry (H)","Vôn (V)"],"c":0,"cat":"Vật lý 11"},
        {"q":"Hiện tượng khúc xạ ánh sáng là khi tia sáng bị:","a":["Gãy khúc tại mặt phân cách môi trường","Hắt lại môi trường cũ","Hấp thụ hoàn toàn","Tán sắc thành nhiều màu"],"c":0,"cat":"Vật lý 11"},
        {"q":"Mắt viễn thị có đặc điểm gì và cần đeo thấu kính nào?","a":["Nhìn gần kém, đeo thấu kính hội tụ","Nhìn xa kém, đeo thấu kính phân kỳ","Nhìn gần kém, đeo thấu kính phân kỳ","Nhìn xa kém, đeo thấu kính hội tụ"],"c":0,"cat":"Vật lý 11"},

        # Hóa học 11
        {"q":"Theo danh pháp IUPAC, C2H5OH được gọi là gì?","a":["Ethanol","Methanol","Phenol","Propanol"],"c":0,"cat":"Hóa học 11"},
        {"q":"Nhóm chức đặc trưng của các hợp chất Carboxylic acid là:","a":["-COOH","-OH","-CHO","-O-"],"c":0,"cat":"Hóa học 11"},
        {"q":"Hồ tinh bột tác dụng với dung dịch nào tạo màu xanh tím?","a":["Dung dịch Iodine (I2)","Bromine","AgNO3/NH3","NaOH"],"c":0,"cat":"Hóa học 11"},
        {"q":"Sản phẩm oxy hóa không hoàn toàn Ethanol bằng CuO đun nóng là?","a":["Ethanal (Acetaldehyde)","Methanal","Acetic acid","Carbon dioxide"],"c":0,"cat":"Hóa học 11"},

        # Sinh học 11
        {"q":"Hoóc môn nào do tuyến yên tiết ra kích thích sinh trưởng cơ thể?","a":["GH (Growth Hormone)","Thyroxine","Estrogen","Testosterone"],"c":0,"cat":"Sinh học 11"},
        {"q":"Phytohormone nào có tác dụng kích thích quả chín và rụng lá?","a":["Ethylene","Auxin","Gibberellin","Cytokinin"],"c":0,"cat":"Sinh học 11"},
        {"q":"Thụ tinh kép ở thực vật có hoa tạo ra gì?","a":["Hợp tử (2n) và phôi nhũ (3n)","Hai hợp tử (2n)","Hợp tử và hạt phấn","Phôi nhũ và túi phôi"],"c":0,"cat":"Sinh học 11"},

        # Ngữ văn 11
        {"q":"Tác giả của bài thơ 'Vội vàng' là ai?","a":["Xuân Diệu","Huy Cận","Hàn Mặc Tử","Chế Lan Viên"],"c":0,"cat":"Ngữ văn 11"},
        {"q":"Nhân vật Chí Phèo đòi ai trả lại lương thiện?","a":["Bá Kiến","Binh Tư","Thị Nở","Lý Cường"],"c":0,"cat":"Ngữ văn 11"},
        {"q":"Bát cháo hành trong Chí Phèo biểu tượng cho điều gì?","a":["Tình nhân bản và sự thức tỉnh","Sự đói khát cùng cực","Lòng tham con người","Sự lạnh lùng xã hội"],"c":0,"cat":"Ngữ văn 11"},
    ]

    # Combine with randomness
    all_q = raw_data
    random.shuffle(all_q)

    header = "const QUIZ_DATA = [\n"
    footer = "];\n\nfunction getRandomQuestion() {\n    return QUIZ_DATA[Math.floor(Math.random() * QUIZ_DATA.length)];\n}\n"
    
    with open("public/js/questions.js", "w", encoding="utf-8") as f:
        f.write(header)
        for q in all_q:
            # Escape quotes
            q_txt = q["q"].replace('"', '\\"')
            ans_list = [a.replace('"', '\\"') for a in q["a"]]
            
            # Shuffle answers inside the array for randomness
            correct_txt = ans_list[q["c"]]
            random.shuffle(ans_list)
            new_c = ans_list.index(correct_txt)
            
            f.write(f'  {{q:"{q_txt}", a:["{ans_list[0]}","{ans_list[1]}","{ans_list[2]}","{ans_list[3]}"], correct:{new_c}, cat:"{q["cat"]}"}},\n')
        f.write(footer)

if __name__ == "__main__":
    generate_questions()
