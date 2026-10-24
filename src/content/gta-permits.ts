/*
 * GTA permit reference for the website assistant (src/lib/chat/knowledge.ts).
 *
 * Every line here was read from the official page linked beside it, on the
 * date in `checkedOn`, and is kept close to the source's own wording. It is
 * what each municipality publishes for homeowners, not a ruling on any
 * property: rules change and the building department decides. A person at
 * PermitGuys should review this file and re-check the pages from time to time.
 *
 * Fees and review times are left out on purpose: they change often, and the
 * site does not quote them. The assistant links the official page instead.
 */

export const GTA_PERMITS_CHECKED_ON = "2026-10-24";

export interface SourceLink {
  label: string;
  url: string;
}

export interface MunicipalPermitInfo {
  name: string;
  region: "City of Toronto" | "Peel Region" | "Halton Region" | "York Region" | "Durham Region";
  /** What the municipality's pages say, in short lines. */
  facts: string[];
  /** How to apply, as published. */
  apply?: string;
  contact?: string;
  sources: SourceLink[];
}

/** Province-wide background that applies across the GTA. */
export const ontarioPermitFacts: { facts: string[]; sources: SourceLink[] } = {
  facts: [
    "Municipalities issue building permits, set permit fees, review applications and inspect construction. Each municipal council appoints a chief building official and inspectors.",
    "The Building Code in force is the 2024 Building Code (the province publishes it as the free 2024 Building Code Compendium).",
    "A zoning by-law controls land use, where buildings can go, building types, lot sizes, heights, parking and setbacks. A municipality refuses a building permit for construction that does not comply.",
    "A minor variance excuses a proposal from a specific zoning requirement when it follows the by-law's general intent; it does not change the by-law. The local Committee of Adjustment, appointed by council, decides minor variances. A use the by-law does not allow needs a zoning by-law amendment (rezoning), which council can approve only if the official plan allows it.",
    "Additional residential units (ARUs): Ontario generally allows up to 3 units on a residential lot as of right without a rezoning: up to 3 in the main house, or up to 2 in the main house plus 1 in an ancillary building such as a garage. A rezoning or minor variance may still be needed for other requirements such as setbacks and height, and each municipality sets its own rules on registration, parking and design.",
    "The province's guide to a second unit in a house lists Building Code points such as minimum room sizes (for example a 13.5 m² living area), basement ceiling height of at least 1.95 m over the required floor area, a 30-minute fire separation between units (15 minutes if the whole house has interconnected smoke alarms), smoke and carbon monoxide alarms, and separate water shut-offs. It says an electrical permit from the Electrical Safety Authority is separate, and that houses under five years old follow different rules. The guide notes parts may not reflect recent planning changes.",
    "Designers who are not architects or engineers must be qualified and registered with the Ministry of Municipal Affairs and Housing: they hold a Building Code Identification Number (BCIN), pass Building Code exams in categories such as House and Small Buildings, and are listed in the public QuARTS registry. Most municipal permit applications include a Schedule 1 designer information form for them.",
    "Under the Architects Act, an architect is not required for buildings of not more than three storeys and not more than 600 m² in gross area, for a house or two attached dwelling units built on grade up to three storeys, and for certain interior alterations within a dwelling unit. Larger projects need an architect. The OAA directory lists licensed architects.",
    "Before digging, call Ontario One Call (1-800-400-2255) for utility locates.",
    "Properties near valleys, streams, wetlands, floodplains or the Lake Ontario shoreline may be in a conservation authority's regulated area and need its permit before the building permit (under the Conservation Authorities Act and O. Reg. 41/24). GTA conservation authorities include the Toronto and Region Conservation Authority (TRCA), Credit Valley Conservation (CVC), Conservation Halton, the Lake Simcoe Region Conservation Authority (LSRCA) and Central Lake Ontario Conservation (CLOCA). TRCA has an online Regulated Area Search.",
  ],
  sources: [
    { label: "Ontario: regulatory roles for construction and renovations", url: "https://www.ontario.ca/page/regulatory-roles-construction-and-renovations" },
    { label: "Ontario's Building Code", url: "https://www.ontario.ca/page/ontarios-building-code" },
    { label: "Ontario: zoning by-laws (citizen's guide to land use planning)", url: "https://www.ontario.ca/document/citizens-guide-land-use-planning/zoning-bylaws" },
    { label: "Ontario: add a second unit in your house", url: "https://www.ontario.ca/page/add-second-unit-your-house" },
    { label: "Ontario: become a registered building practitioner (BCIN, QuARTS)", url: "https://www.ontario.ca/page/become-registered-building-practitioner" },
    { label: "OAA: professional requirements for the built environment in Ontario", url: "https://oaa.on.ca/Assets/Common/Shared_Documents/Documents/Professional%20Requirements%20for%20the%20Built%20Environment%20in%20Ontario_Dec%202025.pdf" },
    { label: "TRCA: planning and permits FAQs and Regulated Area Search", url: "https://trca.ca/planning-permits/faqs/" },
  ],
};

export const gtaPermits: MunicipalPermitInfo[] = [
  {
    name: "Toronto",
    region: "City of Toronto",
    facts: [
      "Toronto Building issues permits. Needs a permit (not a complete list): new buildings and additions, including second or third storeys, attached garages, sunrooms, porches and decks; adding or removing walls; new or enlarged windows and doors; enclosing a deck, porch or patio; sheds of 15 m² or more; accessory structures over 10 m² (any size if attached to a building or with plumbing); decks more than 60 cm (24 in) above ground; retaining walls over 1 m next to public property or areas the public can access; demolition; chimneys, fireplaces and wood stoves; heating and plumbing work; and any change of use, even with no construction.",
      "Finishing a basement needs a permit if it involves structural or material alterations, heating or plumbing changes, excavation or new foundations, underpinning, a new basement entrance or a second suite. Finishing with none of these does not.",
      "No permit (the zoning by-law still applies): uncovered decks at or below 60 cm that are not part of a required exit; insulation; same-size window or door replacement in a house; furnace or boiler replacement in a house; reroofing with no structural work; basement waterproofing repairs; cabinetry; sheds of 15 m² or less, one storey, detached, storage only and without plumbing.",
      "Toronto has building permit application guides for secondary suites, garden suites, laneway suites and multiplex conversions (an existing house converted to a duplex, triplex, fourplex, fiveplex or sixplex), plus pre-approved garden and laneway suite plans and a development charges deferral program for these suites.",
      "Garden suite fire access, per the City's guide: access from the street the house faces, a maximum 45-metre travel distance from the public street to the suite's entrance, and a path at least 1.0 m wide with 2.1 m vertical clearance.",
      "Drawings by a qualified designer must show the designer's name, registration number, qualification ID and signature; the Schedule 1 designer form is required for all designers except engineers and architects. Before applying, Toronto offers a Preliminary Zoning Review and a pre-check tool. Minor variances go to Toronto's Committee of Adjustment.",
    ],
    apply: "Online through the City's building permit services; the application guides list the drawings each project type needs.",
    contact: "311",
    sources: [
      { label: "Toronto: when do I need a building permit?", url: "https://www.toronto.ca/services-payments/building-construction/building-permit/before-you-apply-for-a-building-permit/when-do-i-need-a-building-permit/" },
      { label: "Toronto: before you apply", url: "https://www.toronto.ca/services-payments/building-construction/building-permit/before-you-apply-for-a-building-permit/" },
      { label: "Toronto: building more units on your property", url: "https://www.toronto.ca/services-payments/building-construction/building-permit/adding-new-units-to-residential-properties/" },
      { label: "Toronto: multiplex conversion guide", url: "https://www.toronto.ca/services-payments/building-construction/building-permit/before-you-apply-for-a-building-permit/building-permit-application-guides/additional-dwelling-unit-guides/multiplex-conversion/" },
      { label: "Toronto: new garden suite guide", url: "https://www.toronto.ca/services-payments/building-construction/building-permit/before-you-apply-for-a-building-permit/building-permit-application-guides/renovation-and-new-house-guides/new-garden-suite/" },
      { label: "Toronto: Committee of Adjustment", url: "https://www.toronto.ca/city-government/planning-development/committee-of-adjustment/" },
    ],
  },
  {
    name: "Mississauga",
    region: "Peel Region",
    facts: [
      "Needs a permit: decks greater than 0.61 m (2 ft) high; sheds greater than 15 m², or any size with plumbing; gazebos greater than 10 m²; other structures greater than 10 m² or with plumbing; garages; finishing a basement to create rooms or living space; basement apartments (second units); excavating to increase headroom; below-grade entrances or walkouts; underpinning; new or enlarged windows and doors; dormers; changes to roof height or slope; re-cladding with a different material; adding, removing or relocating plumbing fixtures; HVAC; interior alterations.",
      "No permit (zoning still applies): decks less than 600 mm high; sheds less than 15 m², one storey, free-standing, no plumbing, storage only; gazebos of 10 m² or less; retaining walls under 1 m; damp-proofing and sump pumps; same-size window and door replacement; re-shingling; fences; driveway resurfacing.",
      "Owners of detached, semi-detached and townhouses can build up to two additional residential units; only one garden suite is permitted on a lot. Adding units needs a building permit, and garden suites need a site plan and grading plan even with the City's pre-approved garden suite plans. Standard condominium townhouses do not permit attached units or garden suites. Development charges apply to additions and garden suites.",
    ],
    contact: "311 (905-615-4311 outside City limits); online inquiries at mississauga.ca/BuildingPermitInquiries",
    sources: [
      { label: "Mississauga: when a building permit is required", url: "https://www.mississauga.ca/services-and-programs/building-and-renovating/building-permits/when-a-building-permit-is-required/" },
      { label: "Mississauga: additional residential units", url: "https://www.mississauga.ca/services-and-programs/building-and-renovating/building-more-units-on-your-property/additional-residential-units/" },
      { label: "Mississauga: drawings and documents you need", url: "https://www.mississauga.ca/services-and-programs/building-and-renovating/building-permits/drawings-and-documents-you-need-for-a-building-permit/" },
    ],
  },
  {
    name: "Brampton",
    region: "Peel Region",
    facts: [
      "Up to 3 units per property including the main house: the house plus a second unit and a garden suite, or the house plus a second and a third unit. A unit may be in any part of the dwelling, including the basement.",
      "To be legal, second units, third units and garden suites must be registered with the City, including units for family members or not rented out. A Residential Rental Licence is needed before a unit is rented or occupied.",
      "Parking: no extra space for one additional unit; lots with more than one need an additional space on the property.",
      "Garden suites (rear or interior side yard, freestanding or attached to a detached garage) start with the Planning Division before a building permit application.",
      "Properties in Credit Valley Conservation or TRCA regulated areas need conservation authority approval first. A legal property survey is needed for unit applications. For a below-grade entrance, the City says to consult an engineer or BCIN-qualified designer.",
      "Standard permit packages cover accessory buildings, additions, basement finishing, below-grade entrances, decks, garages, carports and porches. Mature neighbourhood requirements may affect additions and replacement houses.",
    ],
    apply: "Brampton Building and Business Portal: https://bramptonbbp.brampton.ca/citizenportal/",
    contact: "905-874-2401 or 311; building.inquiries@brampton.ca; unit questions twounit.zoning@brampton.ca",
    sources: [
      { label: "Brampton: additional residential units", url: "https://www.brampton.ca/en/residents/Building-Permits/second-dwelling" },
      { label: "Brampton: building permits for homeowners", url: "https://www.brampton.ca/EN/residents/Building-Permits/homeowners" },
    ],
  },
  {
    name: "Caledon",
    region: "Peel Region",
    facts: [
      "Needs a permit: additions (including second or third storeys, attached garages, sunrooms, porches); decks higher than 24 in (60 cm) off the ground at any point; sheds of 15 m² or more; accessory structures larger than 10 m² (any size if attached); finished basements and basement apartments; retaining walls over 1 m next to public property or publicly accessible areas; demolition; structural alterations; new or enlarged windows and doors; septic systems; change of use. Zoning approval is needed before any new project.",
      "No permit: decks no more than 24 in above grade; sheds under 15 m², detached, one storey, storage only, no plumbing; same-size window and door replacement; furnace replacement in a house; basement waterproofing repairs.",
      "Properties in CVC or TRCA regulated areas may need conservation authority approval before a permit is issued.",
    ],
    apply: "Online only, through the Town's building permit web form; the Construction Companion tool builds a document checklist.",
    contact: "building@caledon.ca",
    sources: [{ label: "Caledon: building permits", url: "https://www.caledon.ca/en/living-here/building-permits.aspx" }],
  },
  {
    name: "Oakville",
    region: "Halton Region",
    facts: [
      "Decks: a permit is required for decks greater than 10 m² in area and higher than 61 cm above adjacent grade, and for any size deck attached to a house. Decks need a separate zoning certificate of occupancy approval.",
      "Sheds, cabanas and gazebos: a permit is required if larger than 15 m² or if it includes plumbing. A grading plan is required for detached structures greater than 50 m².",
      "Accessory apartments need a building permit and a separate zoning certificate of occupancy approval. An egress door with walk-up stairs needs drawings by an engineer or BCIN-qualified designer. The Schedule 1 designer form is required when someone other than an architect or engineer designs the project.",
      "Depending on the property: heritage approval (heritage register properties), Conservation Halton approval (excavation on lots backing onto green space, a river bed or a wetland), tree protection, and a development engineering permit for site alteration. Applicants complete an Applicable Law Form.",
    ],
    apply: "Online through the Town's services portal, with drawings reviewed in ePlan (ProjectDox).",
    contact: "ServiceOakville 905-845-6601; building questions buildingrequests@oakville.ca or ext. 7377; zoning ext. 3955",
    sources: [
      { label: "Oakville: building permit application process", url: "https://www.oakville.ca/town-hall/online-services/planning-construction/building-permit-application-process/" },
      { label: "Oakville: decks", url: "https://www.oakville.ca/home-environment/building-renovations/building-permits-inspections/construction-projects/decks/" },
      { label: "Oakville: sheds, cabanas and gazebos", url: "https://www.oakville.ca/home-environment/building-renovations/building-permits-inspections/construction-projects/sheds-cabanas-gazebos/" },
      { label: "Oakville: accessory apartment", url: "https://www.oakville.ca/home-environment/building-renovations/building-permits-inspections/construction-projects/accessory-apartment/" },
    ],
  },
  {
    name: "Burlington",
    region: "Halton Region",
    facts: [
      "No permit for a detached accessory deck for a house that is under 10 m², under 60 cm high and not covered or roofed. Decks outside these limits may need a permit.",
      "No permit for a shed or accessory structure for a house that is one storey or less, under 15 m² and without plumbing (or any structure under 10 m² without plumbing).",
      "No permit for same-opening window and door replacement, uncovered on-grade patios, retaining walls of 1 m or less, and like-for-like heating and cooling replacement. Electrical permits come from the Electrical Safety Authority.",
      "Burlington has an ARU look-up tool and an ARU incentive program on its website.",
    ],
    contact: "Building permits 905-335-7731; Service Burlington 905-335-7777",
    sources: [{ label: "Burlington: do I need a building permit?", url: "https://www.burlington.ca/en/building-and-renovating/do-i-need-a-building-permit.aspx" }],
  },
  {
    name: "Milton",
    region: "Halton Region",
    facts: [
      "A permit is needed before any new building, demolition or renovation, including finishing a basement, adding windows or doors, and building a deck, fence or pool.",
      "Decks: a permit is required for a freestanding deck greater than 10 m², or any deck attached to a building. Schedule 1 is needed when someone other than an architect or engineer prepares the design.",
      "Milton runs an ARU program with pages to build, register and renew registration of an ARU.",
    ],
    apply: "Online portal: https://permits.milton.ca/citizenportal/app/login",
    contact: "905-878-7252 ext. 2397",
    sources: [
      { label: "Milton: building and construction permits", url: "https://www.milton.ca/en/living-in-milton/building-permits-application.aspx" },
      { label: "Milton: decks", url: "https://www.milton.ca/business-development/building-and-renovating/building-permits/decks/" },
      { label: "Milton: additional residential units", url: "https://www.milton.ca/business-development/building-and-renovating/additional-residential-units-aru/" },
    ],
  },
  {
    name: "Halton Hills",
    region: "Halton Region",
    facts: [
      "Needs a permit: decks, sheds greater than 15 m², accessory buildings, garages, gazebos, sunrooms, new buildings, additions, alterations, underpinning, new plumbing, creating an accessory apartment in a house, solar panels, on-site sewage systems, demolition and change of use.",
      "No permit: structures not greater than 10 m² (some small buildings still need one, such as those with plumbing); retaining walls under 1 m; like-for-like furnace replacement; reshingling a house. For sheds between 10 and 15 m², the Town says to contact Building Services.",
    ],
    apply: "Online form: https://forms.haltonhills.ca/Building-Services/Building-Permit-Application",
    contact: "905-873-2600",
    sources: [{ label: "Halton Hills: building permits", url: "https://www.haltonhills.ca/building-permits" }],
  },
  {
    name: "Vaughan",
    region: "York Region",
    facts: [
      "The City of Vaughan publishes homeowner pages for decks and porches, accessory structures, and new structures or additions. Their details could not be read for this reference, so point visitors to the City's pages.",
    ],
    sources: [
      { label: "Vaughan: building permits for homes", url: "https://www.vaughan.ca/residential/building-and-construction/building-permits/building-permits-homes" },
      { label: "Vaughan: permit applications", url: "https://www.vaughan.ca/residential/building-and-construction/building-permits/permit-applications" },
    ],
  },
  {
    name: "Markham",
    region: "York Region",
    facts: [
      "Housing permits cover custom homes, detached garages, sheds, finished basements, wall removal and unenclosed porches; plumbing-only work needs a plumbing permit.",
      "A secondary suite, coach house or garden home needs a permit and registration with Markham Fire and Emergency Services. Converting a house to three or four units needs drawings by a BCIN designer qualified in Small Buildings and Building Services, an architect or a professional engineer.",
      "Applications are reviewed through ePLAN.",
    ],
    contact: "Building counter 905-475-4870",
    sources: [{ label: "Markham: guide to building permits", url: "https://www.markham.ca/economic-development-business/building-permits/guide-building-permits" }],
  },
  {
    name: "Richmond Hill",
    region: "York Region",
    facts: [
      "A permit is needed to construct or demolish any building or addition, for alterations, fireplaces and wood stoves, decks and sunrooms, finished basements, basement walkouts, garages and accessory buildings.",
      "No permit: a detached accessory building such as a shed of 10 m² or less with no plumbing; cupboards; landscaping; reshingling (unless clay tile); eavestroughs; damp-proofing a basement. Zoning by-laws apply even when no permit is required.",
    ],
    apply: "Online: Residential Building Permit form at https://forms.richmondhill.ca/Building-Services/Prescreening-Building-Permit-Submission-Form",
    contact: "905-771-8810; building@richmondhill.ca",
    sources: [{ label: "Richmond Hill: building permit FAQs", url: "https://www.richmondhill.ca/en/online-services/Building-Permit-FAQs.aspx" }],
  },
  {
    name: "Aurora",
    region: "York Region",
    facts: [
      "No permit (zoning still applies): unroofed decks no more than 0.6 m (2 ft) above grade; detached buildings of 15 m² or less without plumbing; finishing a basement with no structural alteration and no added sleeping accommodation; same-opening window and door replacement. Pool enclosure fences need a permit.",
      "Aurora has a registration application for a second or third dwelling unit.",
    ],
    apply: "Online portal: https://cvportal.aurora.ca/Portal/ (or by email to building@aurora.ca)",
    contact: "building@aurora.ca; (365) 500-2081",
    sources: [{ label: "Aurora: applications, permits and inspections", url: "https://www.aurora.ca/home-and-property/building-and-renovating/applications-permits-and-inspections/" }],
  },
  {
    name: "Newmarket",
    region: "York Region",
    facts: [
      "Permit likely required: new homes and additions; additional residential units; attached decks and any deck over 10 m²; detached structures such as sheds over 15 m²; retaining walls over 1 m; adding or removing walls; new or enlarged windows and doors; basement walkouts; HVAC and plumbing work. Finishing a basement may require one.",
      "Typically no permit: standalone buildings of 15 m² or less without plumbing; freestanding decks under 10 m²; same-size window and door replacement.",
      "A Zoning Preliminary Review is required before applying for an ARU, addition, deck, shed, demolition or new construction. Check whether the property is in the LSRCA area or on the heritage register.",
    ],
    apply: "Development Portal: https://aca-prodca.accela.com/NEWMARKET/Default.aspx",
    contact: "building.permits@newmarket.ca; 905-953-5300 ext. 2400",
    sources: [{ label: "Newmarket: building and renovating", url: "https://www.newmarket.ca/business-development/building-renovating" }],
  },
  {
    name: "Pickering",
    region: "Durham Region",
    facts: [
      "Needs a permit: decks more than 60 cm (24 in) above ground; enclosing a deck, porch or patio; accessory structures larger than 15 m² (any size if attached or with plumbing); finishing a basement; underpinning; a basement entrance (a P.Eng. is required for the entrance); adding a second suite; retaining walls over 1 m next to public or publicly accessible areas; a change of use such as a basement den to a bedroom.",
      "No permit: garden sheds under 15 m² without plumbing; basement waterproofing repairs and sump pumps.",
    ],
    apply: "Online Application Portal: https://mycity.pickering.ca/ (paper submissions are not accepted at the counter)",
    contact: "Building Services 905-420-4631",
    sources: [{ label: "Pickering: building permits", url: "https://www.pickering.ca/business-building-development/building-and-renovating/building-permits/" }],
  },
  {
    name: "Ajax",
    region: "Durham Region",
    facts: [
      "Permits cover garages and sheds, decks and porches, demolitions, plumbing, sunrooms and additions, additional dwelling units, below-grade entrances and renovations. The Town has a finished basement guide.",
      "A building permit is not the same as filing an electrical notification with the Electrical Safety Authority; you may need both.",
    ],
    apply: "Online Application Portal: https://eapply.ajax.ca/ (residential) or buildingpermits@ajax.ca",
    contact: "905-619-2529 (option 4, then 2)",
    sources: [{ label: "Ajax: building permits and inspections", url: "https://ajax.ca/life-in-ajax/town-services/construction-permits-inspections/" }],
  },
  {
    name: "Whitby",
    region: "Durham Region",
    facts: [
      "Needs a permit: new homes, additions, sunrooms, porches, carports and garages; decks greater than 24 in above grade; fireplaces; finished basements and walkouts; plumbing, drains and heating; septic systems; adding or removing windows, doors or walls; additional dwelling units; change of use.",
      "A project may also need a minor variance, site plan approval or approval from Central Lake Ontario Conservation (CLOCA).",
    ],
    apply: "E-Portal: https://portal.whitby.ca/ or buildingpermits@whitby.ca",
    contact: "905-430-4300; building@whitby.ca",
    sources: [{ label: "Whitby: building permits", url: "https://www.whitby.ca/services-and-payments/building-and-renovating/building-permits/" }],
  },
  {
    name: "Oshawa",
    region: "Durham Region",
    facts: [
      "Needs a permit: any building or addition; sheds larger than 15 m²; adding a dwelling unit or apartment (basement apartments, accessory units); finishing a basement; alterations; fireplaces and wood stoves; decks and porches; heating and plumbing changes.",
      "No permit: decks 600 mm (24 in) high or less with no roof (houses only); same-size window and door replacement (houses); reshingling; basement waterproofing repair; furnace replacement with the same ductwork; detached structures under 15 m² without plumbing. Zoning applies even without a permit.",
    ],
    apply: "Application Portal: https://www.oshawa.ca/living-here/application-portal/",
    contact: "Service Oshawa 905-436-3311; service@oshawa.ca",
    sources: [{ label: "Oshawa: building permits", url: "https://www.oshawa.ca/living-here/building-and-renovating/building-permits/" }],
  },
];

/** Official hosts the assistant may link to. */
export const officialHosts = [
  ...new Set([...ontarioPermitFacts.sources, ...gtaPermits.flatMap((m) => m.sources)].map((s) => new URL(s.url).hostname.replace(/^www\./, ""))),
];
