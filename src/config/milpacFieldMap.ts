/**
 * MILPAC Field Mapping
 *
 * This file maps your database values (dbId) to the generator's asset IDs (generatorId).
 *
 * - To add a new mapping, copy an entry and fill in the values.
 * - To change an ID, just edit the value in the appropriate field.
 * - Optionally, add aliases for alternate/legacy names.
 *
 * Example:
 *   {
 *     generatorId: "service_citation_1y", // The asset or overlay ID used by the generator
 *     dbId: "1 Year Service Citation",     // The value as it appears in your database
 *     aliases: ["1Y Citation", "Service 1 Year"] // (Optional) Any alternate names
 *   }
 */

export interface MilpacFieldMapping {
    /** The asset or overlay ID used by the generator */
    generatorId: string;
    /** The value as it appears in your database */
    dbId: string;
    /** (Optional) Any alternate/legacy names for this item */
    aliases?: string[];
}

export const milpacFieldMap: MilpacFieldMapping[] = [
    // --- CITATIONS / AWARDS (ribbons) ---
    { generatorId: "unit_proficiency_badge", dbId: "Unit Proficiency", aliases: ["Proficiency Badge"] },
    { generatorId: "1year", dbId: "1 Year Service Citation", aliases: ["1Y Citation", "Service 1 Year"] },
    { generatorId: "2year", dbId: "2 Year Service Citation", aliases: ["2Y Citation", "Service 2 Year"] },
    { generatorId: "3year", dbId: "3 Year Service Citation", aliases: ["3Y Citation", "Service 3 Year"] },
    { generatorId: "4year", dbId: "4 Years+ Service Citation", aliases: ["4Y Citation", "Service 4 Year", "4 Year Service Citation"] },
    { generatorId: "beyond", dbId: "ASOT Beyond Award", aliases: ["Beyond Award"] },
    { generatorId: "brokenlance", dbId: "Broken Lance Award", aliases: ["Broken Lance"] },
    { generatorId: "diplomat", dbId: "Diplomat Award", aliases: ["Diplomat"] },
    { generatorId: "instructor", dbId: "Instructor Award", aliases: ["Instructor"] },
    { generatorId: "publicrelation", dbId: "Public Relations Award", aliases: ["Public Relations"] },
    { generatorId: "groupdevelopment", dbId: "Group Development Award", aliases: ["Group Development"] },
    { generatorId: "architect", dbId: "Architect Award", aliases: ["Architect"] },
    { generatorId: "watchman", dbId: "Watchman Award", aliases: ["Watchman"] },
    { generatorId: "atlas", dbId: "Atlas Award", aliases: ["Atlas"] },
    // Bronze/Silver/Gold Soldiers Medallion are medallions, not ribbons
    { generatorId: "founders", dbId: "Founding Member", aliases: ["Founding Member"] },
    { generatorId: "campaign", dbId: "Completion of a Campaign", aliases: ["Campaign Completion"] },
    { generatorId: "campaign1", dbId: "Campaign Medallion Tier One", aliases: ["Campaign Tier 1"] },
    { generatorId: "campaign2", dbId: "Campaign Medallion Tier Two", aliases: ["Campaign Tier 2"] },
    { generatorId: "campaign3", dbId: "Campaign Medallion Tier Three", aliases: ["Campaign Tier 3"] },
    { generatorId: "campaign4", dbId: "Campaign Medallion Tier Four", aliases: ["Campaign Tier 4"] },
    { generatorId: "campaign5", dbId: "Campaign Medallion Tier Five", aliases: ["Campaign Tier 5"] },
    { generatorId: "campaign6", dbId: "Campaign Medallion Tier Six", aliases: ["Campaign Tier 6"] },
    { generatorId: "campaign7", dbId: "Campaign Medallion Tier Seven", aliases: ["Campaign Tier 7"] },
    { generatorId: "campaign8", dbId: "Campaign Medallion Tier Eight", aliases: ["Campaign Tier 8"] },
    { generatorId: "gallantry", dbId: "Gallantry Award", aliases: ["Gallantry"] },
    { generatorId: "starofcourage", dbId: "Star of Courage", aliases: ["Star of Courage"] },
    { generatorId: "crossofvalour", dbId: "ASOT Cross of Valour", aliases: ["Cross of Valour"] },
    { generatorId: "protagonist", dbId: "Protagonist Award", aliases: ["Protagonist"] },
    { generatorId: "juniorleadership", dbId: "Junior Leadership Award", aliases: ["Junior Leadership"] },
    { generatorId: "seniorleadership", dbId: "Senior Leadership Award", aliases: ["Senior Leadership"] },
    { generatorId: "aviation", dbId: "Rotary Aviation Medal", aliases: ["Aviation Medal"] },
    { generatorId: "medical", dbId: "Medical Medallion", aliases: ["Medical"] },
    // The following awards do not have a matching ribbon PNG:
    // { generatorId: "acknowledgement", dbId: "Acknowledgement Reward" },
    // { generatorId: "appreciation", dbId: "Appreciation Reward" },
    // { generatorId: "dedication", dbId: "Dedication Reward" },
    // { generatorId: "bronze_soldiers_medallion", dbId: "Bronze Soldiers Medallion" },
    // { generatorId: "silver_soldiers_medallion", dbId: "Silver Soldiers Medallion" },
    // { generatorId: "gold_soldiers_medallion", dbId: "Gold Soldiers Medallion" },
  // --- RANKS (from milpac-options.json) ---
    { generatorId: "2LT", dbId: "2nd Lieutenant", aliases: ["2LT"] },
    { generatorId: "2LTV", dbId: "", aliases: ["2LTV"] },
    { generatorId: "AC", dbId: "Aircraftsman AC", aliases: ["AC"] },
    { generatorId: "ACM", dbId: "Air Chief Marshal", aliases: ["ACM"] },
    { generatorId: "AVM", dbId: "Air Vice Marshal", aliases: ["AVM"] },
    { generatorId: "BDR", dbId: "Bombardier", aliases: ["BDR"] },
    { generatorId: "BDRJ", dbId: "Junior Bombardier", aliases: ["BDRJ"] },
    { generatorId: "BDRL", dbId: "Leading Bombadier", aliases: ["BDRL"] },
    { generatorId: "BDRP", dbId: "Bombadier Proficient", aliases: ["BDRP"] },
    { generatorId: "BDRS", dbId: "Senior Bombadier", aliases: ["BDRS"] },
    { generatorId: "BRIG", dbId: "Brigadier", aliases: ["BRIG"] },
    { generatorId: "BSGT", dbId: "Battery Sergeant", aliases: ["BSGT"] },
    { generatorId: "CAPT", dbId: "Captain", aliases: ["CAPT"] },
    { generatorId: "CLT", dbId: "Commanding Lieutenant", aliases: ["CLT"] },
    { generatorId: "CLTV", dbId: "", aliases: ["CLTV"] },
    { generatorId: "COA", dbId: "", aliases: ["COA"] },
    { generatorId: "COL", dbId: "Colonel", aliases: ["COL"] },
    { generatorId: "COM", dbId: "Commodore", aliases: ["COM"] },
    { generatorId: "CPL", dbId: "Corporal", aliases: ["CPL"] },
    { generatorId: "CPLJ", dbId: "Junior Corporal", aliases: ["CPLJ"] },
    { generatorId: "CPLL", dbId: "Leading Corporal", aliases: ["CPLL"] },
    { generatorId: "CPLP", dbId: "Corporal Proficient", aliases: ["CPLP"] },
    { generatorId: "CPLS", dbId: "Senior Corporal", aliases: ["CPLS"] },
    { generatorId: "CPLV", dbId: "", aliases: ["CPLV"] },
    { generatorId: "CPLVJ", dbId: "", aliases: ["CPLVJ"] },
    { generatorId: "CPLVL", dbId: "", aliases: ["CPLVL"] },
    { generatorId: "CPLVP", dbId: "", aliases: ["CPLVP"] },
    { generatorId: "CPLVS", dbId: "", aliases: ["CPLVS"] },
    { generatorId: "CSM", dbId: "Company Sergeant Major", aliases: ["CSM"] },
    { generatorId: "FLL", dbId: "Flight Leader", aliases: ["FLL"] },
    { generatorId: "FLT", dbId: "Flight Lieutenant", aliases: ["FLT"] },
    { generatorId: "FOF", dbId: "Flying Officer", aliases: ["FOF"] },
    { generatorId: "FSGT", dbId: "Flight Sergeant FSGT", aliases: ["FSGT"] },
    { generatorId: "GCPT", dbId: "Group Captain", aliases: ["GCPT"] },
    { generatorId: "GEN", dbId: "General", aliases: ["GEN"] },
    { generatorId: "GMD", dbId: "Game Master Distinguished GM(D)", aliases: ["GMD"] },
    { generatorId: "GMG", dbId: "Game Master Grand GM(G)", aliases: ["GMG"] },
    { generatorId: "GMP", dbId: "Game Master Proficient", aliases: ["GMP"] },
    { generatorId: "GMS", dbId: "Game Master Senior GM(S)", aliases: ["GMS"] },
    { generatorId: "GNRL", dbId: "Leading Gunner", aliases: ["GNRL"] },
    { generatorId: "GNRS", dbId: "Senior Gunner", aliases: ["GNRS"] },
    { generatorId: "GNRSL", dbId: "Senior Leading Gunner", aliases: ["GNRSL"] },
    { generatorId: "HAM", dbId: "", aliases: ["HAM"] },
    { generatorId: "HOCDT", dbId: "Officer Cadet", aliases: ["HOCDT"] },
    { generatorId: "LAC", dbId: "Leading Aircraftsman LAC", aliases: ["LAC"] },
    { generatorId: "LBDR", dbId: "Lance Bombardier", aliases: ["LBDR"] },
    { generatorId: "LBDRJ", dbId: "Junior Lance Bombardier", aliases: ["LBDRJ"] },
    { generatorId: "LBDRL", dbId: "Leading Lance Bombardier", aliases: ["LBDRL"] },
    { generatorId: "LBDRP", dbId: "Lance Bombardier Proficient", aliases: ["LBDRP"] },
    { generatorId: "LCPL", dbId: "Lance Corporal", aliases: ["LCPL"] },
    { generatorId: "LCPLJ", dbId: "Junior Lance Corporal", aliases: ["LCPLJ"] },
    { generatorId: "LCPLL", dbId: "Leading Lance Corporal", aliases: ["LCPLL"] },
    { generatorId: "LCPLP", dbId: "Lance Corporal Proficient", aliases: ["LCPLP"] },
    { generatorId: "LCPLS", dbId: "Senior Lance Corporal", aliases: ["LCPLS"] },
    { generatorId: "LCPLV", dbId: "", aliases: ["LCPLV"] },
    { generatorId: "LCPLVJ", dbId: "", aliases: ["LCPLVJ"] },
    { generatorId: "LCPLVL", dbId: "", aliases: ["LCPLVL"] },
    { generatorId: "LCPLVP", dbId: "", aliases: ["LCPLVP"] },
    { generatorId: "LCPLVS", dbId: "", aliases: ["LCPLVS"] },
    { generatorId: "LDBRS", dbId: "", aliases: ["LDBRS"] },
    { generatorId: "LM", dbId: "Loadmaster LM", aliases: ["LM"] },
    { generatorId: "LT", dbId: "Lieutenant", aliases: ["LT"] },
    { generatorId: "LTCOL", dbId: "Lieutenant Colonel", aliases: ["LTCOL"] },
    { generatorId: "LTGEN", dbId: "Lieutenant General", aliases: ["LTGEN"] },
    { generatorId: "LTV", dbId: "", aliases: ["LTV"] },
    { generatorId: "MAJ", dbId: "Major", aliases: ["MAJ"] },
    { generatorId: "MAJGEN", dbId: "Major General", aliases: ["MAJGEN"] },
    { generatorId: "OCDT", dbId: "Officer Cadet", aliases: ["OCDT"] },
    { generatorId: "OCDTV", dbId: "", aliases: ["OCDTV"] },
    { generatorId: "POF", dbId: "Pilot Officer", aliases: ["POF"] },
    { generatorId: "PSM", dbId: "Platoon Sergeant Major", aliases: ["PSM"] },
    { generatorId: "PSMV", dbId: "", aliases: ["PSMV"] },
    { generatorId: "PTEL", dbId: "", aliases: ["PTEL"] },
    { generatorId: "PTES", dbId: "", aliases: ["PTES"] },
    { generatorId: "PTESL", dbId: "", aliases: ["PTESL"] },
    { generatorId: "PTSG", dbId: "", aliases: ["PTSG"] },
    { generatorId: "RSM", dbId: "Regimental Sergeant Major", aliases: ["RSM"] },
    { generatorId: "RSMA", dbId: "RSM of ASOT", aliases: ["RSMA"] },
    { generatorId: "SACM", dbId: "Senior Air Chief Marshal", aliases: ["SACM"] },
    { generatorId: "SAM", dbId: "Sergeant-at-arms", aliases: ["SAM"] },
    { generatorId: "SAMV", dbId: "", aliases: ["SAMV"] },
    { generatorId: "SAPL", dbId: "", aliases: ["SAPL"] },
    { generatorId: "SAPS", dbId: "", aliases: ["SAPS"] },
    { generatorId: "SAPSL", dbId: "", aliases: ["SAPSL"] },
    { generatorId: "SCAPT", dbId: "Staff Captain", aliases: ["SCAPT"] },
    { generatorId: "SFLT", dbId: "", aliases: ["SFLT"] },
    { generatorId: "SGT", dbId: "Sergeant", aliases: ["SGT"] },
    { generatorId: "SGTV", dbId: "", aliases: ["SGTV"] },
    { generatorId: "SLM", dbId: "", aliases: ["SLM"] },
    { generatorId: "SLT", dbId: "Senior Lieutenant", aliases: ["SLT"] },
    { generatorId: "SLTV", dbId: "", aliases: ["SLTV"] },
    { generatorId: "SQLD", dbId: "Squadron Leader", aliases: ["SQLD"] },
    { generatorId: "SSAM", dbId: "Senior Sergeant-at-arms", aliases: ["SSAM"] },
    { generatorId: "SSAMV", dbId: "", aliases: ["SSAMV"] },
    { generatorId: "SSGT", dbId: "Staff Sergeant", aliases: ["SSGT"] },
    { generatorId: "SSGTV", dbId: "", aliases: ["SSGTV"] },
    { generatorId: "TPRL", dbId: "Leading Trooper", aliases: ["TPRL"] },
    { generatorId: "TPRS", dbId: "Senior Trooper", aliases: ["TPRS"] },
    { generatorId: "TPRSL", dbId: "Senior Leading Trooper", aliases: ["TPRSL"] },
    { generatorId: "TSGM", dbId: "Troop Sergeant Major", aliases: ["TSGM"] },
    { generatorId: "WGCDR", dbId: "Wing Commander", aliases: ["WGCDR"] },
    { generatorId: "WGCP", dbId: "Wing Captain", aliases: ["WGCP"] },
    { generatorId: "WO1", dbId: "Warrant Officer Class 1", aliases: ["WO1"] },
    { generatorId: "WO2", dbId: "Warrant Officer Class 2", aliases: ["WO2"] },
];

/**
 * Usage Example:
 *
 * // Find the mapping for a database value (dbValue):
 * const mapping = milpacFieldMap.find(m => m.dbId === dbValue || m.aliases?.includes(dbValue));
 * const assetId = mapping ? mapping.generatorId : dbValue; // fallback to dbValue if not mapped
 */
