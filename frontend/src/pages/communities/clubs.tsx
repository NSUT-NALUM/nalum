import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Society {
  name: string;
  description: string;
  category: 'technical' | 'cultural' | 'social' | 'sports' | 'entrepreneurship' | 'literary' | 'automotive';
  image?: string;
}

const societies: Society[] = [
  {
    name: "CROSSLINKS",
    description: "The Student and Public Relations Society of NSUT serving as the official bridge between students, authorities, and the wider public, playing a key role in representing NSUT on national platforms.",
    category: "social",
    image: "/Communities/Clubs/Crosslinks.jpeg"
  },
  {
    name: "NSUT IIF",
    description: "Innovation and Incubation Foundation established in October 2016, supporting innovation and entrepreneurship by incubating startups founded by NSUT students, alumni, and faculty with mentorship and seed funding.",
    category: "entrepreneurship",
    image: "/Communities/Clubs/NSUTIIF.jpeg"
  },
  {
    name: "ENACTUS",
    description: "Social entrepreneurship society empowering students to apply business skills to address real-world social and environmental challenges through sustainable, community-driven projects.",
    category: "entrepreneurship",
    image: "/Communities/Clubs/Enactus.png"
  },
  {
    name: "DEVCOMM",
    description: "International Developers' Community serving as a one-stop platform for practical tech experiences through real-life projects, overnight hackathons, and coding sprints.",
    category: "technical",
    image: "/Communities/Clubs/Devcom.jpeg"
  },
  {
    name: "THE ALLIANCE",
    description: "NSUT's student-run newspaper connecting the entire campus community, covering news, features, interviews, and perspectives that matter to students across all years and departments.",
    category: "literary",
    image: "/Communities/Clubs/TheAlliance.jpeg"
  },
  {
    name: "IEEE NSUT",
    description: "Student chapter promoting technical excellence, innovation, and research culture through workshops, seminars, technical talks, and hands-on sessions bridging theory and practice.",
    category: "technical",
    image: "/Communities/Clubs/IEEE.jpeg"
  },
  {
    name: "JUNOON",
    description: "Photography and videography club providing a platform for visual storytelling, capturing campus life through photowalks, workshops, and creative projects like Storygram and Humans of NSUT.",
    category: "cultural",
    image: "/Communities/Clubs/junoon-logo-only.png"
  },
  {
    name: "180 DC",
    description: "180 Degrees Consulting works with non-profits, social enterprises, and startups to deliver high-impact solutions, providing hands-on project experience in strategy, research, and operations.",
    category: "entrepreneurship",
    image: "/Communities/Clubs/180DC.png"
  },
  {
    name: "DEBSOC",
    description: "Official debating society fostering articulate, confident, and analytical thinkers through debates, MUNs, discussion forums, and workshops strengthening communication abilities.",
    category: "literary",
    image: "/Communities/Clubs/Debsoc.png"
  },
  {
    name: "FES",
    description: "Finance and Economics Society promoting critical thinking and practical knowledge through workshops, competitions, and Consilium - an annual business conclave featuring case competitions and fintech challenges.",
    category: "entrepreneurship",
    image: "/Communities/Clubs/FES.jpg"
  },
  {
    name: "HUMANICA",
    description: "HR and Organizational Behavior society empowering students with understanding of people management, workplace dynamics, and organizational culture through workshops and case studies.",
    category: "entrepreneurship",
    image: "/Communities/Clubs/HUMANICA.jpg"
  },
  {
    name: "IGTS",
    description: "Indian Game Theory Society promoting understanding and application of game theory and strategic thinking through workshops, discussions, case studies, and practical simulations.",
    category: "entrepreneurship",
    image: "/Communities/Clubs/IGTS.jpg"
  },
  {
    name: "INTAGLIOS",
    description: "Design Society bringing together students passionate about graphic design, UI/UX, branding, and illustration through hands-on workshops, design challenges, and collaborative projects.",
    category: "cultural",
    image: "/Communities/Clubs/INTAGLIOS.jpeg"
  },
  {
    name: "TEAM KALPANA",
    description: "Official aerospace and rocketry society driven by passion for space technology, actively designing, building, testing, and launching rockets while participating in national and international competitions.",
    category: "technical",
    image: "/Communities/Clubs/TEAM KALPANA.jpeg"
  },
  {
    name: "MARKSTREET SOCIETY",
    description: "Marketing society exploring marketing beyond textbooks through hands-on campaigns, live projects, case studies, brand strategy, content creation, and analytics that mirror real industry challenges.",
    category: "entrepreneurship",
    image: "/Communities/Clubs/MARKSTREET.jpg"
  },
  {
    name: "MUDRAKALA",
    description: "Indian performing arts society celebrating diverse forms including classical dance, contemporary dance, and yoga while nurturing students' creative abilities and cultural appreciation.",
    category: "cultural",
    image: "/Communities/Clubs/MUDRAKALA.jpg"
  },
  {
    name: "NSS",
    description: "National Service Scheme unit operating under 'Not Me But You,' focusing on selfless service through environmental conservation, cleanliness drives, awareness campaigns, and social outreach.",
    category: "social",
    image: "/Communities/Clubs/NSS.png"
  },
  {
    name: "ROTARACT",
    description: "Rotaract Club of NSUT committed to creating positive social impact through service initiatives, volunteer work, awareness campaigns, and humanitarian projects addressing real-world challenges.",
    category: "social",
    image: "/Communities/Clubs/ROTARACT.jpg"
  },
  {
    name: "SUBHASHA",
    description: "Literary chapter celebrating literature, creative writing, poetry, and storytelling through blogs, essays, poems, literary events, writing sessions, and reading circles.",
    category: "literary",
    image: "/Communities/Clubs/SUBHASHA.jpg"
  },
  {
    name: "TATSAM",
    description: "Hindi cultural and literary society promoting appreciation of Hindi language and its rich heritage through poetry, prose, storytelling, competitions, and creative expression.",
    category: "literary",
    image: "/Communities/Clubs/TATSAM.jpg"
  },
  {
    name: "TDR",
    description: "Team Daedalus Racing focuses on automotive design, engineering, and competitive motorsports, building race cars and participating in engineering challenges and automotive events.",
    category: "automotive",
    image: "/Communities/Clubs/TDR.jpg"
  },
  {
    name: "AAGAAZ",
    description: "Poetry society promoting culture of poetry and creative expression through verse and spoken word, organizing poetry sessions, open mics, competitions, and creative gatherings.",
    category: "literary",
    image: "/Communities/Clubs/AAGAAZ.jpg"
  },
  {
    name: "MIRAGE DANCE CREW",
    description: "Official dance society celebrating movement and rhythm through contemporary, hip-hop, Bollywood, and fusion, conducting rehearsals, workshops, and performances.",
    category: "cultural",
    image: "/Communities/Clubs/MIRAGE DANCE CREW.jpg"
  },
  {
    name: "CLITCH",
    description: "Fashion Society bringing together students passionate about fashion, design, and style, organizing fashion shows, workshops, photoshoots, and celebrating creative expression.",
    category: "cultural",
    image: "/Communities/Clubs/CLITCH.jpg"
  },
  {
    name: "D'CODE",
    description: "Competitive programming and technology society building strong coding culture through live sessions, coding contests, workshops, and specialised groups in AI/ML, web development, and design.",
    category: "technical",
    image: "/Communities/Clubs/D’CODE.jpeg"
  },
  {
    name: "CANVAS",
    description: "Fine arts society bringing together students passionate about visual arts, exploring drawing, painting, sketching, and design through workshops, exhibitions, and creative challenges.",
    category: "cultural",
    image: "/Communities/Clubs/CANVAS.jpg"
  },
  {
    name: "SHATRANJ",
    description: "Chess Club providing platform for members to play, learn, and improve chess skills through regular practice sessions, friendly matches, internal tournaments, and strategy discussions.",
    category: "sports",
    image: "/Communities/Clubs/SHATRANJ NSUT.jpg"
  },
  {
    name: "ASME NSUT",
    description: "Student chapter of American Society of Mechanical Engineers building strong community through workshops, competitions, technical events, and creative engineering challenges.",
    category: "technical",
    image: "/Communities/Clubs/ASME.jpg"
  },
  {
    name: "AXIOM",
    description: "Philosophy society encouraging deep thinking, critical reflection, and meaningful discussion about life, knowledge, and reasoning through conversations and intellectual explorations.",
    category: "literary",
    image: "/Communities/Clubs/AXIOM.jpg"
  },
  {
    name: "GDG NSUT",
    description: "Google Developer Group bringing together student developers for collaborative learning in web development, mobile apps, machine learning, cloud technologies, and UI/UX design.",
    category: "technical",
    image: "/Communities/Clubs/GDG.jpg"
  },
  {
    name: "FINSOC",
    description: "Finance society building financial awareness and practical knowledge through interactive workshops, guest lectures, discussions, and competitions on financial markets and investments.",
    category: "entrepreneurship",
    image: "/Communities/Clubs/FINSOC.jpg"
  },
  {
    name: "ASHWAMEDH",
    description: "Dramatics and performing arts society creating opportunities to explore dramatic expression, acting, character development, and stagecraft through rehearsals, workshops, and productions.",
    category: "cultural",
    image: "/Communities/Clubs/ASHWAMEDH.jpg"
  },
  {
    name: "SPIC MACAY",
    description: "Society for Promotion of Indian Classical Music and Culture creating awareness of India's rich heritage through classical music, dance, folk arts, yoga, and traditional performances.",
    category: "cultural",
    image: "/Communities/Clubs/SPICMACAY.jpeg"
  },
  {
    name: "TDS",
    description: "The Debugging Society focuses on building strong programming and problem-solving skills through regular assignments, coding tasks, quizzes, and interactive sessions.",
    category: "technical",
    image: "/Communities/Clubs/TDS.jpeg"
  },
  {
    name: "VENATUS",
    description: "Official gaming and esports society promoting strong esports culture through gaming tournaments, LAN events, strategy competitions, and team-based games encouraging collaboration.",
    category: "sports",
    image: "/Communities/Clubs/VENATUS.jpg"
  },
  {
    name: "ECELL",
    description: "Entrepreneurship Cell supporting innovation and startup culture through workshops, bootcamps, mentorship sessions, pitch events, and business plan competitions connecting students with founders.",
    category: "entrepreneurship",
    image: "/Communities/Clubs/ECELL.jpg"
  },
  {
    name: "SHAKESJEER",
    description: "Open mic and performance arts society providing platform for live expression through spoken word, stand-up comedy, poetry, storytelling, beatboxing, and music performances.",
    category: "cultural",
    image: "/Communities/Clubs/SHAKESJEER.jpg"
  },
  {
    name: "NAKSHATRA",
    description: "Astronomy and Mathematics Society offering academic initiatives, astronomy events, workshops, talks, and competitions while highlighting achievements and contributions of its members.",
    category: "technical",
    image: "/Communities/Clubs/NAKSHATRA.jpg"
  },
  {
    name: "NCC",
    description: "The NCC Unit is a premier youth development organization governed by the Ministry of Defence. Operating under the motto Unity and Discipline, its fundamental goal is to develop character, comradeship, secular outlook, the spirit of adventure, and ideals of selfless service among students, while creating a trained resource pool for national defense.",
    category: "social",
    image: "/Communities/Clubs/NCC.jpg"
  },
  {
    name: "CRESCENDO",
    description: "Crescendo is the official music society of NSUT, serving as the premier campus hub for vocalists, instrumentalists, and music producers. The group performs diverse genres—from classical to rock.",
    category: "cultural",
    image: "/Communities/Clubs/CRESCENDO.jpg"
  },
  {
    name: "CAPELLA",
    description: "Capella is the official choreography society of NSUT, specializing in high-energy, storytelling-based group dance productions. The team combines deep, thematic concepts with synchronized movements.",
    category: "cultural",
    image: "/Communities/Clubs/CAPELLA.jpg"
  },
  {
    name: "NSUTQC",
    description: "The Quiz Club (QC) is a premier, student-run organization dedicated to fostering an intellectually vibrant culture centered around curiosity, trivia, and lateral thinking.",
    category: "literary",
    image: "/Communities/Clubs/NSUTQC.jpeg"
  },
  {
    name: "ARES ROBOTICS",
    description: "ARES Robotics is an elite student engineering team that designs and builds functional Mars Rovers. Composed of technical and business departments, they develop advanced autonomous system.",
    category: "technical",
    image: "/Communities/Clubs/ARESROBOTICS.jpg"
  },
  {
    name: "PRAYAS",
    description: "Prayas is a student-run social welfare group that provides free education and mentorship to underprivileged children through daily evening classes on campus. They also organize healthcare camps.",
    category: "literary",
    image: "/Communities/Clubs/PRAYAS.jpg"
  },
  {
    name: "ASN",
    description: "ASN (Algorithm Society of NSUT) is a student-run technical society dedicated to Competitive Programming (CP) and Data Structures & Algorithms (DSA) and the community hosts weekly lectures.",
    category: "technical",
    image: "/Communities/Clubs/ASN.jpg"
  },
  {
    name: "CSI",
    description: "CSI NSUT is an official technical society focusing on software development, coding, and IT. The club hosts workshops, hackathons, and placement prep to build industry-ready engineering skills.",
    category: "technical",
    image: "/Communities/Clubs/CSI.jpg"
  },
  {
    name: "NSUT.AI",
    description: "NSUT.AI is an official research-focused society dedicated to Artificial Intelligence, Machine Learning, and Data Science. Backed by a strong global alumni network.",
    category: "technical",
    image: "/Communities/Clubs/NSUTAI.jpg"
  },
  {
    name: "WASD",
    description: "WASD is the official Game Development society at Netaji Subhas University of Technology (NSUT). Its core mission is to create a collaborative hub for students passionate about gaming and building interactive entertainment.",
    category: "sports",
    image: "/Communities/Clubs/WASD.jpg"
  },
  {
    name: "BULLETHAWK RACING",
    description: "BulletHawk Racing (BHR) is the official Formula Student combustion and electric engineering team at Netaji Subhas University of Technology (NSUT).",
    category: "automotive",
    image: "/Communities/Clubs/BULLETHAWK.jpg"
  }
];
societies.sort((a, b) => a.name.localeCompare(b.name));

const categories = [
  { value: 'all', label: 'All Societies', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  { value: 'technical', label: 'Technical', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { value: 'cultural', label: 'Cultural', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
  { value: 'entrepreneurship', label: 'Entrepreneurship', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
  { value: 'literary', label: 'Literary', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { value: 'social', label: 'Social', color: 'bg-rose-50 text-rose-700 hover:bg-rose-100' },
  { value: 'sports', label: 'Sports', color: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100' },
  { value: 'automotive', label: 'Automotive', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
];

const ITEMS_PER_PAGE = 9;

const ClubsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const filteredSocieties = societies.filter(society => {
    const matchesCategory = selectedCategory === 'all' || society.category === selectedCategory;
    const matchesSearch = society.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          society.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.ceil(filteredSocieties.length / ITEMS_PER_PAGE);
  const currentSocieties = filteredSocieties.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-nsut-beige/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-nsut-maroon to-[#800000] text-white py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
            Clubs of NSUT
          </h1>
          <p className="text-lg md:text-xl max-w-4xl leading-relaxed opacity-95 animation-delay-300 animate-fade-in">
            Student societies play a vital role in the holistic development of students at NSUT. They provide platforms to explore interests beyond academics, including technical, cultural, and social domains. Through events, workshops, and competitions, societies enhance leadership, teamwork, and communication skills while encouraging peer learning, creativity, and real-world problem solving.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12">
        {/* Search and Filter Section */}
        <div className="mb-8 space-y-6">
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category.value
                    ? 'bg-nsut-maroon text-white shadow-lg scale-105'
                    : category.color
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            Showing <span className="font-bold text-nsut-maroon">{filteredSocieties.length}</span> {filteredSocieties.length === 1 ? 'society' : 'societies'}
          </p>
        </div>

        {/* Societies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {currentSocieties.map((society, index) => (
            <div
              key={society.name}
              className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-nsut-yellow/50 animate-fade-in flex flex-col h-full"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Card Header with Gradient */}
              <div className="h-2 bg-gradient-to-r from-nsut-maroon via-nsut-yellow to-nsut-maroon bg-[length:200%_100%] group-hover:animate-[shimmer_2s_infinite] transition-all duration-300"></div>
              
              <div className="p-6 flex-grow flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="font-serif text-xl font-bold text-nsut-maroon group-hover:text-[#800000] transition-colors duration-300 flex-grow">
                    {society.name}
                  </h3>
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                    {society.image ? (
                      <img src={society.image} alt={society.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-gray-300 font-serif">{society.name.charAt(0)}</span>
                    )}
                  </div>
                </div>

                {/* Category Badge */}
                <div className="mb-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    society.category === 'technical' ? 'bg-blue-50 text-blue-700' :
                    society.category === 'cultural' ? 'bg-purple-50 text-purple-700' :
                    society.category === 'entrepreneurship' ? 'bg-green-50 text-green-700' :
                    society.category === 'literary' ? 'bg-amber-50 text-amber-700' :
                    society.category === 'social' ? 'bg-rose-50 text-rose-700' :
                    'bg-cyan-50 text-cyan-700'
                  }`}>
                    {society.category.charAt(0).toUpperCase() + society.category.slice(1)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 mb-4 flex-grow">
                  {society.description}
                </p>

                {/* Decorative Bottom Border */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <div className="h-1 w-0 bg-gradient-to-r from-nsut-maroon to-nsut-yellow group-hover:w-full transition-all duration-500 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 animate-fade-in">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-nsut-maroon"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-full font-medium transition-all duration-300 ${
                    currentPage === page
                      ? 'bg-nsut-maroon text-white shadow-lg scale-110'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-nsut-maroon"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}

        {/* No Results */}
        {filteredSocieties.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No societies found matching your criteria.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ClubsPage;