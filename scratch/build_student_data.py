import json

raw_placements = """RCAS2024BCY046,INBAVARUNAN S,Cyber Security,Zoho Corporation,Application Security Engineer,₹ 8.5 LPA,SELECTED,OFFERED,2026-07-15,PLACED
RCAS2024BCY002,Sneha D,Cyber Security,Microsoft India,Software Engineer - Azure Cloud,₹ 21.5 LPA,SELECTED,JOINED,2026-08-10,PLACED
RCAS2024BBA003,Mythili B,Business Administration,Deloitte USI,Business Technology Analyst,₹ 7.5 LPA,SELECTED,JOINED,2026-07-13,PLACED
RTC2024BCY004,Naveen V,Cyber Security,Wipro Digital,Cyber Defense Analyst,₹ 6.8 LPA,SELECTED,OFFERED,2026-07-28,PLACED
RTC2024BIT005,Gautham S,Information Technology,-,-,,REGISTERED,-,-,YET_TO_BE_PLACED
RTC2024BCS006,Barath P,Computer Science,Flipkart,Associate Software Engineer - Supply Chain,₹ 11.0 LPA,SELECTED,OFFERED,2026-06-17,PLACED
RCAS2024BCY007,Archana A,Cyber Security,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RCAS2024BBA008,Manoj K,Business Administration,Deloitte USI,Business Technology Analyst,₹ 7.5 LPA,SELECTED,OFFERED,2026-06-15,PLACED
RCAS2024BCS009,Subhashini N,Computer Science,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RCAS2024BCY010,Lavanya L,Cyber Security,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RTC2024BBA011,Nandhakumar P,Business Administration,Tata Consultancy Services,Systems Engineer - Digital,₹ 7.0 LPA,SELECTED,JOINED,2026-07-19,PLACED
RTC2024BBA012,Siddharth J,Business Administration,HDFC Bank,Management Trainee - Tech FinOps,₹ 6.2 LPA,SELECTED,JOINED,2026-08-23,PLACED
RTC2024BIT013,Hemalatha L,Information Technology,Amazon Development Centre,Software Development Engineer (SDE-1),₹ 19.5 LPA,SELECTED,JOINED,2026-08-27,PLACED
RTC2024BCS014,Arun S,Computer Science,Tata Consultancy Services,Systems Engineer - Digital,₹ 7.0 LPA,SELECTED,JOINED,2026-06-28,PLACED
RTC2024BEC015,Nandhini L,Electronics and Communication,Cognizant Technology Solutions,Programmer Analyst Trainee,₹ 6.5 LPA,SELECTED,JOINED,2026-07-20,PLACED
RCAS2024BIT016,Pooja K,Information Technology,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RTC2024BCS017,Jeevan G,Computer Science,-,-,,REGISTERED,-,-,YET_TO_BE_PLACED
RCAS2024BEC018,Hariharan P,Electronics and Communication,Qualcomm India,Firmware & Embedded Security Engineer,₹ 14.5 LPA,SELECTED,OFFERED,2026-08-27,PLACED
RCAS2024BCS019,Kavin S,Computer Science,Amazon Development Centre,Software Development Engineer (SDE-1),₹ 19.5 LPA,SELECTED,OFFERED,2026-06-22,PLACED
RCAS2024BBA020,Balaji K,Business Administration,Tata Consultancy Services,Systems Engineer - Digital,₹ 7.0 LPA,SELECTED,JOINED,2026-07-14,PLACED
RTC2024BCY021,Akshaya T,Cyber Security,Oracle India,Associate Cloud Consultant,₹ 12.5 LPA,SELECTED,JOINED,2026-07-12,PLACED
RCAS2024BIT022,Ramya P,Information Technology,Flipkart,Associate Software Engineer - Supply Chain,₹ 11.0 LPA,SELECTED,OFFERED,2026-06-14,PLACED
RCAS2024BBA023,Naveen D,Business Administration,Deloitte USI,Business Technology Analyst,₹ 7.5 LPA,SELECTED,JOINED,2026-07-18,PLACED
RTC2024BIT024,Saravanan L,Information Technology,Adobe Systems,Member of Technical Staff - Creative Cloud,₹ 16.5 LPA,SELECTED,JOINED,2026-07-28,PLACED
RCAS2024BCS025,Subhashini R,Computer Science,Amazon Web Services (AWS),Cloud Support Associate - DevOps & Sec,₹ 17.0 LPA,SELECTED,JOINED,2026-08-23,PLACED
RTC2024BIT026,Rajeswari R,Information Technology,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RCAS2024BCS027,Lavanya R,Computer Science,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RCAS2024BEC028,Barath K,Electronics and Communication,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RCAS2024BCY029,Meena J,Cyber Security,Oracle India,Associate Cloud Consultant,₹ 12.5 LPA,SELECTED,JOINED,2026-08-16,PLACED
RCAS2024BCS030,Pradeep A,Computer Science,Flipkart,Associate Software Engineer - Supply Chain,₹ 11.0 LPA,SELECTED,OFFERED,2026-08-13,PLACED
RTC2024BCY031,Akshaya G,Cyber Security,Cognizant Technology Solutions,Programmer Analyst Trainee,₹ 6.5 LPA,SELECTED,JOINED,2026-08-19,PLACED
RCAS2024BCY032,INBAVARUNAN P,Cyber Security,Tata Consultancy Services,Systems Engineer - Digital,₹ 7.0 LPA,SELECTED,OFFERED,2026-08-15,PLACED
RCAS2024BBA033,Bhavani G,Business Administration,Deloitte USI,Business Technology Analyst,₹ 7.5 LPA,SELECTED,OFFERED,2026-08-12,PLACED
RTC2024BIT034,Nandhakumar N,Information Technology,Cognizant Technology Solutions,Programmer Analyst Trainee,₹ 6.5 LPA,SELECTED,JOINED,2026-08-17,PLACED
RTC2024BIT035,Meena T,Information Technology,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RTC2024BIT036,Manikandan T,Information Technology,Oracle India,Associate Cloud Consultant,₹ 12.5 LPA,SELECTED,JOINED,2026-08-19,PLACED
RCAS2024BBA037,Saravanan V,Business Administration,Tata Consultancy Services,Systems Engineer - Digital,₹ 7.0 LPA,SELECTED,JOINED,2026-06-23,PLACED
RTC2024BCS038,Yuvan N,Computer Science,Cognizant Technology Solutions,Programmer Analyst Trainee,₹ 6.5 LPA,SELECTED,OFFERED,2026-06-25,PLACED
RCAS2024BCS039,Raghav T,Computer Science,Infosys,Specialist Programmer (Power Programmer),₹ 9.5 LPA,SELECTED,OFFERED,2026-08-10,PLACED
RCAS2024BEC040,Raghav R,Electronics and Communication,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RTC2024BCS041,Deepak T,Computer Science,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RCAS2024BIT042,Adithya N,Information Technology,Amazon Web Services (AWS),Cloud Support Associate - DevOps & Sec,₹ 17.0 LPA,SELECTED,OFFERED,2026-06-19,PLACED
RCAS2024BCY043,Adithya J,Cyber Security,Zoho Corporation,Application Security Engineer,₹ 8.5 LPA,SELECTED,OFFERED,2026-08-13,PLACED
RCAS2024BCS044,Madhumitha L,Computer Science,Palo Alto Networks,SOC & Cyber Defense Analyst,₹ 10.0 LPA,SELECTED,OFFERED,2026-07-14,PLACED
RTC2024BCY045,Logesh G,Cyber Security,Amazon Web Services (AWS),Cloud Support Associate - DevOps & Sec,₹ 17.0 LPA,SELECTED,OFFERED,2026-06-18,PLACED
RCAS2024BEC046,Nandhini L,Electronics and Communication,Oracle India,Associate Cloud Consultant,₹ 12.5 LPA,SELECTED,JOINED,2026-08-18,PLACED
RCAS2024BCS047,Soundarya K,Computer Science,-,-,,REGISTERED,-,-,YET_TO_BE_PLACED
RTC2024BCY048,Mukesh K,Cyber Security,CrowdStrike India,Threat Intelligence Specialist,₹ 13.0 LPA,SELECTED,JOINED,2026-07-17,PLACED
RTC2024BCS049,Karthik V,Computer Science,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RCAS2024BIT050,Naveen C,Information Technology,Adobe Systems,Member of Technical Staff - Creative Cloud,₹ 16.5 LPA,SELECTED,OFFERED,2026-07-13,PLACED
RCAS2024BEC051,Madhumitha P,Electronics and Communication,Amazon Web Services (AWS),Cloud Support Associate - DevOps & Sec,₹ 17.0 LPA,SELECTED,OFFERED,2026-08-11,PLACED
RTC2024BCS052,Balaji P,Computer Science,Deloitte USI,Business Technology Analyst,₹ 7.5 LPA,SELECTED,JOINED,2026-08-23,PLACED
RTC2024BBA053,Vasanth S,Business Administration,HDFC Bank,Management Trainee - Tech FinOps,₹ 6.2 LPA,SELECTED,JOINED,2026-06-23,PLACED
RCAS2024BCY054,Subash T,Cyber Security,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RCAS2024BCS055,Kavitha A,Computer Science,Oracle India,Associate Cloud Consultant,₹ 12.5 LPA,SELECTED,JOINED,2026-07-19,PLACED
RCAS2024BBA056,Lavanya G,Business Administration,HDFC Bank,Management Trainee - Tech FinOps,₹ 6.2 LPA,SELECTED,OFFERED,2026-08-28,PLACED
RCAS2024BCY057,Bhuvaneshwari B,Cyber Security,-,-,,REGISTERED,-,-,YET_TO_BE_PLACED
RCAS2024BCY058,Ananya T,Cyber Security,Salesforce India,Associate Software Engineer,₹ 13.5 LPA,SELECTED,OFFERED,2026-08-11,PLACED
RCAS2024BCY059,Kavin P,Cyber Security,Amazon Web Services (AWS),Cloud Support Associate - DevOps & Sec,₹ 17.0 LPA,SELECTED,JOINED,2026-08-25,PLACED
RCAS2024BIT060,Bhuvaneshwari S,Information Technology,CrowdStrike India,Threat Intelligence Specialist,₹ 13.0 LPA,SELECTED,OFFERED,2026-07-27,PLACED
RTC2024BIT061,Ajith M,Information Technology,Oracle India,Associate Cloud Consultant,₹ 12.5 LPA,SELECTED,JOINED,2026-07-25,PLACED
RCAS2024BEC062,Manikandan R,Electronics and Communication,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RTC2024BCY063,Bhavani D,Cyber Security,Tata Consultancy Services,Systems Engineer - Digital,₹ 7.0 LPA,SELECTED,JOINED,2026-07-20,PLACED
RCAS2024BBA064,Karpagam K,Business Administration,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RCAS2024BCS065,Keerthana T,Computer Science,-,-,,REGISTERED,-,-,YET_TO_BE_PLACED
RCAS2024BCS066,Jeevan R,Computer Science,-,-,,REGISTERED,-,-,YET_TO_BE_PLACED
RTC2024BEC067,Pradeep J,Electronics and Communication,Amazon Web Services (AWS),Cloud Support Associate - DevOps & Sec,₹ 17.0 LPA,SELECTED,OFFERED,2026-08-13,PLACED
RCAS2024BCS068,Mukesh P,Computer Science,Cisco Systems,Network Security Engineer,₹ 15.0 LPA,SELECTED,JOINED,2026-06-22,PLACED
RCAS2024BBA069,Nandhini T,Business Administration,Deloitte USI,Business Technology Analyst,₹ 7.5 LPA,SELECTED,JOINED,2026-07-28,PLACED
RCAS2024BCY070,Raghav D,Cyber Security,Cisco Systems,Network Security Engineer,₹ 15.0 LPA,SELECTED,OFFERED,2026-07-10,PLACED
RCAS2024BCY071,Vithya A,Cyber Security,-,-,,REGISTERED,-,-,YET_TO_BE_PLACED
RTC2024BIT072,Janani B,Information Technology,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RCAS2024BBA073,Suresh S,Business Administration,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RTC2024BCY074,Dhanush J,Cyber Security,Microsoft India,Software Engineer - Azure Cloud,₹ 21.5 LPA,SELECTED,JOINED,2026-06-22,PLACED
RTC2024BCS075,Nithya V,Computer Science,Palo Alto Networks,SOC & Cyber Defense Analyst,₹ 10.0 LPA,SELECTED,JOINED,2026-06-25,PLACED
RCAS2024BBA076,Manikandan V,Business Administration,Deloitte USI,Business Technology Analyst,₹ 7.5 LPA,SELECTED,JOINED,2026-07-13,PLACED
RCAS2024BEC077,Santhosh R,Electronics and Communication,Zoho Corporation,Application Security Engineer,₹ 8.5 LPA,SELECTED,OFFERED,2026-07-11,PLACED
RTC2024BEC078,Pavithra T,Electronics and Communication,Oracle India,Associate Cloud Consultant,₹ 12.5 LPA,SELECTED,JOINED,2026-06-24,PLACED
RTC2024BBA079,Vignesh B,Business Administration,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RTC2024BIT080,Janani V,Information Technology,-,-,,REGISTERED,-,-,YET_TO_BE_PLACED
RTC2024BCY081,Swetha S,Cyber Security,Microsoft India,Software Engineer - Azure Cloud,₹ 21.5 LPA,SELECTED,JOINED,2026-07-26,PLACED
RTC2024BIT082,Dharshini G,Information Technology,-,-,,REGISTERED,-,-,YET_TO_BE_PLACED
RCAS2024BCS083,Vijay A,Computer Science,Cognizant Technology Solutions,Programmer Analyst Trainee,₹ 6.5 LPA,SELECTED,OFFERED,2026-07-26,PLACED
RCAS2024BEC084,Dhanush N,Electronics and Communication,Qualcomm India,Firmware & Embedded Security Engineer,₹ 14.5 LPA,SELECTED,JOINED,2026-07-22,PLACED
RCAS2024BEC085,Naveen V,Electronics and Communication,Amazon Web Services (AWS),Cloud Support Associate - DevOps & Sec,₹ 17.0 LPA,SELECTED,OFFERED,2026-07-14,PLACED
RCAS2024BBA086,Yogalakshmi G,Business Administration,Tata Consultancy Services,Systems Engineer - Digital,₹ 7.0 LPA,SELECTED,JOINED,2026-08-16,PLACED
RCAS2024BCS087,Ashwin K,Computer Science,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RTC2024BCS088,Subathra G,Computer Science,Cisco Systems,Network Security Engineer,₹ 15.0 LPA,SELECTED,OFFERED,2026-08-22,PLACED
RCAS2024BCS089,Kabilan B,Computer Science,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RTC2024BIT090,Akash R,Information Technology,Salesforce India,Associate Software Engineer,₹ 13.5 LPA,SELECTED,OFFERED,2026-06-21,PLACED
RCAS2024BBA091,Rahul B,Business Administration,Deloitte USI,Business Technology Analyst,₹ 7.5 LPA,SELECTED,OFFERED,2026-07-19,PLACED
RCAS2024BEC092,INBAVARUNAN T,Electronics and Communication,Amazon Development Centre,Software Development Engineer (SDE-1),₹ 19.5 LPA,SELECTED,JOINED,2026-07-12,PLACED
RCAS2024BBA093,Madhumitha A,Business Administration,HDFC Bank,Management Trainee - Tech FinOps,₹ 6.2 LPA,SELECTED,OFFERED,2026-06-23,PLACED
RCAS2024BBA094,Nandhini A,Business Administration,Deloitte USI,Business Technology Analyst,₹ 7.5 LPA,SELECTED,JOINED,2026-06-21,PLACED
RCAS2024BIT095,Jeevan C,Information Technology,Wipro Digital,Cyber Defense Analyst,₹ 6.8 LPA,SELECTED,JOINED,2026-08-28,PLACED
RCAS2024BBA096,Balaji B,Business Administration,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RCAS2024BEC097,Gautham P,Electronics and Communication,Infosys,Specialist Programmer (Power Programmer),₹ 9.5 LPA,SELECTED,JOINED,2026-08-11,PLACED
RCAS2024BIT098,Balaji B,Information Technology,Cisco Systems,Network Security Engineer,₹ 15.0 LPA,SELECTED,JOINED,2026-08-24,PLACED
RCAS2024BBA099,Soundarya G,Business Administration,-,-,,ATTENDED,-,-,YET_TO_BE_PLACED
RCAS2024BEC100,Naveen G,Electronics and Communication,Cisco Systems,Network Security Engineer,₹ 15.0 LPA,SELECTED,OFFERED,2026-07-22,PLACED"""

with open("c:/Users/sweet/OneDrive/Desktop/Placement Hub/placementos/scratch/records.json", "r") as f:
    records = json.load(f)

placement_map = {}
for line in raw_placements.strip().split("\n"):
    parts = [p.strip() for p in line.split(",")]
    if len(parts) >= 10:
        roll = parts[0]
        company = parts[3] if parts[3] != "-" else "N/A"
        role = parts[4] if parts[4] != "-" else "N/A"
        cpa = parts[5] if parts[5] != "-" and parts[5] != "" else "N/A"
        status = parts[9]
        placement_map[roll] = {
            "companyPlaced": company,
            "roleOffered": role,
            "packageCtc": cpa,
            "placementStatus": status
        }

for r in records:
    roll = r["rollNumber"]
    if roll in placement_map:
        info = placement_map[roll]
        r["companyPlaced"] = info["companyPlaced"]
        r["roleOffered"] = info["roleOffered"]
        r["packageCtc"] = info["packageCtc"]
        r["placementStatus"] = info["placementStatus"]
        if info["roleOffered"] != "N/A":
            r["jobRole"] = info["roleOffered"]

ts_content = f"""export interface StudentRecord {{
  id: string;
  rollNumber: string;
  name: string;
  department: string;
  gender: string;
  residenceType: string;
  sslc: string;
  hsc: string;
  ug: string;
  pg: string;
  email: string;
  mobile: string;
  github: string;
  linkedin: string;
  resumeLink: string;
  selfIntroLink: string;
  photoLink: string;
  portfolioLink: string;
  graduationYear: number;
  skills: string;
  education: string;
  experience: string;
  project: string;
  jobRole: string;
  location: string;
  placementStatus: "PLACED" | "YET_TO_BE_PLACED" | "UNPLACED";
  companyPlaced: string;
  roleOffered: string;
  packageCtc: string;
  resumeScore: string;
  archived: boolean;
}}

export const INITIAL_STUDENT_CSV_DATA: StudentRecord[] = {json.dumps(records, indent=2)};
"""

with open("c:/Users/sweet/OneDrive/Desktop/Placement Hub/placementos/src/lib/studentCsvData.ts", "w") as f:
    f.write(ts_content)

print(f"Successfully generated studentCsvData.ts with {len(records)} authentic CSV student profiles!")
