// ============================================================
// Sample CSV Data — Downloadable demo files
// ============================================================

export interface SampleCSV {
  name: string;
  description: string;
  filename: string;
  content: string;
}

export const sampleCSVs: SampleCSV[] = [
  {
    name: 'Facebook Lead Ads',
    description: 'Standard Facebook Lead Ads export with 12 leads',
    filename: 'facebook_leads_june.csv',
    content: `created_time,full_name,email,phone_number,campaign_name,ad_name,platform,city,state,country
2024-06-01T10:30:00+05:30,Rajesh Kumar,rajesh.kumar@gmail.com,+919876543210,Summer Campaign,Ad Set 1,facebook,Mumbai,Maharashtra,India
2024-06-01T11:15:00+05:30,Priya Sharma,priya.sharma@yahoo.com,09123456789,Summer Campaign,Ad Set 1,facebook,Delhi,Delhi,India
2024-06-02T09:00:00+05:30,Amit Patel,amit.p@hotmail.com,+91 98765 12345,Summer Campaign,Ad Set 2,facebook,Ahmedabad,Gujarat,India
2024-06-02T14:30:00+05:30,Sneha Reddy,sneha.reddy@outlook.com,8876543210,Monsoon Offer,Ad Set 3,facebook,Hyderabad,Telangana,India
2024-06-03T08:45:00+05:30,Mohammed Ali,,+919988776655,Monsoon Offer,Ad Set 3,facebook,Bangalore,Karnataka,India
2024-06-03T12:00:00+05:30,Kavitha Nair,kavitha.n@gmail.com,,Monsoon Offer,Ad Set 4,facebook,Kochi,Kerala,India
2024-06-04T16:20:00+05:30,Vikram Singh,vikram.singh@gmail.com,+917766554433,Premium Leads,Ad Set 5,facebook,Jaipur,Rajasthan,India
2024-06-04T17:00:00+05:30,Ananya Das,ananya.das@yahoo.in,09654321098,Premium Leads,Ad Set 5,facebook,Kolkata,West Bengal,India
2024-06-05T10:10:00+05:30,Suresh Menon,suresh.m@gmail.com,+919911223344,Premium Leads,Ad Set 6,facebook,Chennai,Tamil Nadu,India
2024-06-05T11:30:00+05:30,Deepika Joshi,,+918899001122,Summer Campaign,Ad Set 1,facebook,Pune,Maharashtra,India
2024-06-06T09:15:00+05:30,Rahul Verma,rahul.verma@gmail.com,7788996655,Monsoon Offer,Ad Set 3,facebook,Lucknow,Uttar Pradesh,India
2024-06-06T14:45:00+05:30,Meera Krishnan,meera.k@outlook.com,+919876001234,Premium Leads,Ad Set 6,facebook,Bangalore,Karnataka,India`,
  },
  {
    name: 'Real Estate Leads',
    description: 'Property inquiry leads with possession dates',
    filename: 'real_estate_leads.csv',
    content: `Lead Name,WhatsApp No.,Email Address,Interested Project,Lead Stage,Assigned Agent,Lead Created,Possession Timeline,City,Budget Range,Remarks
Arun Mehta,+91-9876543210,arun.mehta@gmail.com,Eden Park,Interested - call tomorrow,Sanjay K,01/03/2024,Q2 2025,Bangalore,80L-1Cr,Wants 3BHK
Pooja Desai,9845678901,pooja.d@yahoo.com,Meridian Tower,Didn't answer,Ravi M,05/03/2024,Q4 2024,Pune,60-80L,Follow up needed
Sunil Rao,+919765432198,sunil.rao@hotmail.com,Sarjapur Plots,Payment complete,Sanjay K,10/03/2024,Immediate,Bangalore,40-60L,Registration done
Nisha Gupta,08876543210,,Eden Park,Not interested,Priya S,12/03/2024,Q1 2025,Mumbai,1-1.5Cr,Budget too high
Karthik R,+91 98234 56789,karthik.r@gmail.com; karthi_r@outlook.com,Varah Swamy,Very interested,Ravi M,15/03/2024,Q3 2025,Chennai,50-70L,Wants site visit
Lakshmi Iyer,,lakshmi.iyer@gmail.com,Eden Park,Interested - call tomorrow,Priya S,18/03/2024,Q2 2025,Bangalore,70-90L,2BHK preferred
Rajendra Shah,9988776655 / 8877665544,raj.shah@gmail.com,Meridian Tower,Didn't answer multiple times,Sanjay K,20/03/2024,Q1 2025,Ahmedabad,90L-1.2Cr,Investor lead
,,,,,,25/03/2024,,,,
Farhan Ahmed,+919123456780,farhan.a@outlook.com,Sarjapur Plots,Interested,Ravi M,28/03/2024,Q4 2025,Bangalore,35-50L,Plots only`,
  },
  {
    name: 'Messy Agency Export',
    description: 'Inconsistent columns from a marketing agency',
    filename: 'messy_agency_export.csv',
    content: `Contact Person,Primary Contact,Alternate Contact,Email ID,Secondary Email,Campaign,Status,Company/Organization,Notes,Date Added,Location
"Sharma, Vivek",9876543210,,vivek.sharma@techcorp.in,,Google Ads Q1,Active Lead,TechCorp Solutions,Called twice - interested in enterprise plan,2024-01-15,"Bangalore, KA"
Deepa M,+91-8765432109,9876543211,deepa.m@startup.io,deepa.personal@gmail.com,Facebook Lead Gen,Converted,InnoStart Pvt Ltd,Signed annual contract,2024-01-20,"Mumbai, MH"
Anand K,not available,NA,anand@business.com,,LinkedIn Campaign,Dead Lead,,"Refused to talk, asked to remove",2024-02-01,"Delhi, DL"
Priyanka Reddy,08876123456,,priyanka.r@mediafirm.com,,Google Ads Q1,Follow Up,MediaFirm Agency,Schedule demo next week,2024-02-10,"Hyderabad, TS"
Test Lead,1234567890,,test@test.com,,Test,Test,Test,THIS IS A TEST,2024-01-01,Test
Rahul B,+919988776655,,rahul.b@manufacturing.co.in,,Facebook Lead Gen,Interested,Bharat Manufacturing,"Wants pricing for 50+ seats, very promising",2024-02-15,"Pune, MH"
Customer Support,,,support@company.com,,,,,"Not a lead, internal contact",2024-02-20,
Megha Jain,7766554433,,megha.j@designstudio.in,,LinkedIn Campaign,Meeting Scheduled,Jain Design Studio,Demo on Friday 3pm,2024-03-01,"Jaipur, RJ"`,
  },
  {
    name: 'Ambiguous Columns',
    description: 'Tricky headers requiring AI interpretation',
    filename: 'ambiguous_columns.csv',
    content: `Sl.No,Prospect,Contact 1,Contact 2,Mail,Org,Place,Region,Zone,Handler,Disposition,Source,Timeline,Feedback
1,Arjun Nair,9876543210,arjun.n@gmail.com,,TCS,Trivandrum,Kerala,South,Agent A,Hot Lead,leads_on_demand,3 months,Very interested in premium plan
2,Bhavna S,+918765432109,,bhavna@infosys.com,Infosys,Electronic City,Karnataka,South,Agent B,Cold,eden_park,6 months,No response after 3 attempts
3,Chandan M,7654321098,,chandan.m@wipro.com,Wipro,Whitefield,Karnataka,South,Agent A,Warm Lead,,1 month,Asked for callback next Monday
4,Divya R,,divya.r@gmail.com,divya.work@company.com,,HITEC City,Telangana,South,Agent C,Deal Closed,meridian_tower,Immediate,Payment received
5,Eshan K,9543216780,eshan@startup.com,,StartupXYZ,Koramangala,Karnataka,South,Agent B,Did not pick up,varah_swamy,2 months,Try after Diwali
6,Fatima B,,,,,,,North,Agent D,No Contact Info,,Unknown,Missing details
7,Ganesh P,8432109876,ganesh.p@outlook.com,,Reliable Systems,Baner,Maharashtra,West,Agent A,Qualified Lead,sarjapur_plots,4 months,"Multiple requirements, needs detailed discussion"`,
  },
  {
    name: 'Invalid Records Test',
    description: 'Mix of valid and skip-worthy records',
    filename: 'invalid_records_test.csv',
    content: `Name,Phone,Email,Status,Notes
Arjun Kumar,9876543210,arjun@gmail.com,Interested,Good lead
,,,, 
Invalid Person,abc,not-an-email,Unknown,Bad data
Priya Sharma,,priya@outlook.com,Follow Up,Email only lead
Mobile Only,+919988776655,,Hot Lead,No email
No Contact,,,Interested,Should be skipped
"Multi Contact",9876543210 / 8765432109,multi@gmail.com; multi2@yahoo.com,Converted,Multiple contacts
Empty Fields,,,,
Half Data,9123456780,,Warm,Partial info
Complete Lead,+91-7766554433,complete@company.com,Payment Done,All fields present`,
  },
];

export function downloadSampleCSV(sample: SampleCSV) {
  const blob = new Blob([sample.content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = sample.filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function createSampleFile(sample: SampleCSV): File {
  const blob = new Blob([sample.content], { type: 'text/csv' });
  return new File([blob], sample.filename, { type: 'text/csv' });
}
