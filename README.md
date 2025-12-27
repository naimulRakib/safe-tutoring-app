SCHOLARGRID
Deployed link https://scholar-grid.vercel.app/

The Safe Operating System for Home Education


 The Elevator PitchScholarGrid is a hyper-local, safety-first operating system that connects students and tutors using PostGIS radar technology, ensuring verified identities, secure escrow payments, and real-time safety tracking for home education in Dhaka.
 
  Demo & VisualsTutor Radar: (PostGIS)
  
  Safety Admin HQFind verified tutors within 500m radius.Real-time panic alerts and tracking.Student DashboardTutor ProfileManage active classes & QR attendance.University verified credentials.✨ Key Features🛡️ Safety InfrastructurePanic Protocol: A dedicated "SOS" button for tutors that streams live location and contact details to the Admin Safety HQ.Privacy Shield: Personal contact details (Phone/Address) are hidden until a proposal is explicitly accepted.University Verification: Automatic email validation for BUET, DMC, DU, and other top-tier universities.
  
   Hyper-Local IntelligencePostGIS Radar: Instead of browsing endless lists, students see tutors plotted on a map based on real-time geospatial queries.Cluster Zones: Optimized for high-density areas like "Mirpur", "Azimpur", and "Farmgate".🔐 
   
   
   Double-Lock FinanceEscrow Payments: Demo class fees are held securely.2-Step Handshake: 1.  Code 1 (Start): Tutor verifies arrival.2.  Code 2 (End): Student releases payment after class completion.
   
   
   Operating SystemQR Attendance: Digital signature for every class session.Connection Manager: Unified inbox for managing proposals and active contracts.
   
   Ghost ID Handling: Robust system to handle legacy or bulk-imported data without crashing
   
   
   Tech StackFramework: 
   
   Next.js 15 (App Router, Server Actions)Database: Supabase (PostgreSQL)Geo-Spatial: PostGIS (Geometry & Geography types)Maps: Leaflet.js / React-Leaflet (Dark Mode Custom Tiles)Styling: Tailwind CSS + Lucide React IconsAuthentication: Supabase Auth (Email/Password + Magic Link),Vercel git actions
   
   
   ⚙️ Installation1. Clone the RepoBashgit clone https://github.com/naimulRakib/safe-tutoring-app.git


cd scholargrid
2. Install DependenciesBashnpm install
# or
yarn install
3. Environment SetupCreate a .env.local file in the root directory and add your Supabase credentials:Code snippetNEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
4. Database Setup (SQL)Run the provided SQL scripts in your Supabase SQL Editor to set up:tutors, students, applications, contracts tables.safety_alerts table with triggered events.Enable postgis extension.(See /database/schema.sql for the full query set).

UsageRun the development server:Bash

npm run dev

Build:
npm run build

Open http://localhost:3000 in your browser.Student Portal: /dashboard (Login as Student)Tutor Portal: /tutor/dashboard (Login as Tutor)Admin HQ: /admin/safety (Monitor active threats)Map Radar: /gps (Test the PostGIS features)🤝 Contributing


Feautures: 
PostGIS Distance calculating 
Mapping with leaflet js, QR react, Gen Ai Api , Groq Sdk LLM chatbot, Extractor js .
Smart Filtering, 
Double OTP handshake, Live tracing demo 
Ai Search with filtered Data for minimal token usage ..


Available Contribution :
Make post GIS based GPS more accurate for open source map APi.

We welcome contributions to make home education safer!Fork the Project.Create your Feature Branch (git checkout -b feature/AmazingFeature).Commit your Changes (git commit -m 'Add some AmazingFeature').Push to the Branch (git push origin feature/AmazingFeature).Open a Pull Request.📄 LicenseDistributed under the MIT License. 

See LICENSE for more information.Built with ❤️ for Safe Education in Bangladesh.
