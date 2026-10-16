import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_styled_table(doc, headers, rows_data, col_widths=None):
    table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    # Header Row
    hdr_cells = table.rows[0].cells
    for i, header_text in enumerate(headers):
        hdr_cells[i].text = header_text
        set_cell_background(hdr_cells[i], "9C4212")  # Dharohar terracotta
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.bold = True
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(255, 255, 255)
            run.font.name = "Segoe UI"

    # Data Rows
    for r_idx, row in enumerate(rows_data):
        row_cells = table.rows[r_idx + 1].cells
        bg_color = "FDFBF7" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, cell_value in enumerate(row):
            row_cells[c_idx].text = str(cell_value)
            set_cell_background(row_cells[c_idx], bg_color)
            set_cell_margins(row_cells[c_idx], top=80, bottom=80, left=120, right=120)
            p = row_cells[c_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.size = Pt(9)
                run.font.name = "Segoe UI"
                run.font.color.rgb = RGBColor(40, 35, 30)

    # Set Column Widths if provided
    if col_widths:
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Inches(w)

    doc.add_paragraph() # Spacing
    return table

def build_word_document():
    doc = Document()

    # Set Standard Margins (1 inch)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)

    # =========================================================================
    # DOCUMENT COVER / TITLE
    # =========================================================================
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(10)
    title_p.paragraph_format.space_after = Pt(4)
    run_brand = title_p.add_run("DHAROHAR: INDIAN DIGITAL HERITAGE PORTAL")
    run_brand.font.size = Pt(22)
    run_brand.font.bold = True
    run_brand.font.color.rgb = RGBColor(156, 66, 18) # #9C4212 Terracotta
    run_brand.font.name = "Georgia"

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(18)
    run_sub = sub_p.add_run("Technical Specification & Database Schema Architecture (Phase-1)")
    run_sub.font.size = Pt(13)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(100, 90, 80)
    run_sub.font.name = "Segoe UI"

    # Metadata Box
    meta_p = doc.add_paragraph()
    meta_p.paragraph_format.space_before = Pt(0)
    meta_p.paragraph_format.space_after = Pt(20)
    r_meta = meta_p.add_run("Target Database: MongoDB Atlas Cloud Cluster  |  Architecture: 5 Isolated Category Collections\nDocument Version: 1.0.0 (Production Verified)  |  Date: October 2026")
    r_meta.font.size = Pt(9)
    r_meta.font.bold = True
    r_meta.font.color.rgb = RGBColor(70, 70, 70)

    # Divider
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(16)
    r_div = p_div.add_run("—" * 65)
    r_div.font.color.rgb = RGBColor(200, 190, 180)

    # =========================================================================
    # 1. ARCHITECTURAL OVERVIEW
    # =========================================================================
    h1 = doc.add_heading(level=1)
    r = h1.add_run("1. Architectural Overview & Collection Isolation")
    r.font.color.rgb = RGBColor(156, 66, 18)
    r.font.name = "Georgia"

    doc.add_paragraph(
        "Dharohar employs a strict 5-Collection Isolated Category Architecture. Rather than combining all heritage records into a single generic table, each cultural category is mapped to its own dedicated MongoDB collection with a typed schema, immutable category locking, and strict field validation."
    )

    overview_headers = ["Category Title", "Canonical Slug", "Mongoose Model", "MongoDB Collection", "Primary Purpose"]
    overview_data = [
        ["Heritage & Places", "heritage-places", "HeritagePlace", "heritage_places", "Famous monuments, forts, landmarks & ASI top attractions"],
        ["Hidden Places", "hidden-places", "HiddenPlace", "hidden_places", "Lesser-known shrines, trails, scenic spots & local legends"],
        ["Culture & Traditions", "culture-traditions", "CultureTradition", "culture_traditions", "Living rituals, seasonal festivals, spiritual customs"],
        ["Arts & Folk", "arts-folk", "ArtFolk", "arts_folk", "Traditional performing arts, indigenous crafts, tribal paintings & dances"],
        ["Food & Markets", "food-markets", "FoodMarket", "food_markets", "Iconic street delicacies, historic recipes & traditional bazaars"],
    ]
    create_styled_table(doc, overview_headers, overview_data, [1.5, 1.4, 1.3, 1.4, 2.0])

    # =========================================================================
    # 2. BASE CONTENT SCHEMA (COMMON FIELDS FOR ALL 5 COLLECTIONS)
    # =========================================================================
    h1 = doc.add_heading(level=1)
    r = h1.add_run("2. Base Content Schema (Inherited by all 5 Collections)")
    r.font.color.rgb = RGBColor(156, 66, 18)
    r.font.name = "Georgia"

    doc.add_paragraph(
        "All 5 category collections inherit a standardized base schema defined in baseContentSchema.js. This guarantees uniform geospatial querying, indexing, administrative curation lifecycle, and media attachments across all categories."
    )

    base_headers = ["Field Name", "BSON Type", "Required", "Default / Constraints", "Description"]
    base_data = [
        ["_id", "ObjectId", "Yes (Auto)", "MongoDB Primary Key", "Unique identifier of the heritage document"],
        ["cityId", "ObjectId (Ref: City)", "Yes", "Indexed", "Foreign key linking the item to its District / City"],
        ["districtId", "ObjectId (Ref: City)", "Optional", "Indexed", "Compatibility alias identical to cityId"],
        ["stateId", "ObjectId (Ref: State)", "Yes", "Indexed", "Foreign key linking the item to its State"],
        ["section", "String", "Yes", "Immutable, Category Locked", "Exact canonical category slug (e.g., 'heritage-places')"],
        ["category", "String", "Yes", "Title String", "Human-readable category label (e.g., 'Heritage & Places')"],
        ["title", "String", "Yes", "Trimmed, Min 2 chars", "Official name of the heritage record / monument"],
        ["subtitle", "String", "No", "Default: ''", "Secondary caption or historical subtitle"],
        ["slug", "String", "Yes", "Unique, Indexed", "URL-friendly unique slug (e.g. rajwada-palace-123456)"],
        ["shortDescription", "String", "No", "Default: ''", "Brief summary for card display, search, and previews"],
        ["fullDescription", "String", "No", "Default: ''", "Full detailed historical monograph and architectural context"],
        ["status", "String (Enum)", "Yes", "['draft', 'review', 'published', 'hidden', 'archived']", "Curation workflow status. Only 'published' is visible to citizens"],
        ["isFeatured", "Boolean", "No", "Default: false", "Flags top-tier priority highlights on city dashboard"],
        ["mediaEnabled", "Boolean", "No", "Default: true", "Toggle enabling photo/video carousel on detail monograph"],
        ["documentsEnabled", "Boolean", "No", "Default: true", "Toggle enabling PDF research documents & circulars module"],
        ["latitude", "Number", "No", "Min: -90, Max: 90", "Geographic latitude in decimal degrees"],
        ["longitude", "Number", "No", "Min: -180, Max: 180", "Geographic longitude in decimal degrees"],
        ["location", "GeoJSON Point", "No", "2dsphere Index", "{ type: 'Point', coordinates: [lng, lat] } for 'Around Me'"],
        ["fields", "Sub-Schema", "Yes", "Strict Category Fields", "Category-specific dynamic schema validated strictly per category"],
        ["media", "Array[MediaItem]", "No", "Embedded Array", "List of images, videos, audio archives, and 360-degree views"],
        ["documents", "Array[DocItem]", "No", "Embedded Array", "List of official ASI circulars, research papers, and monographs"],
        ["sources", "Array[SourceItem]", "No", "Embedded Array", "Bibliography, citations, licenses, and verifications"],
        ["publishedAt", "Date", "No", "Set when published", "Timestamp when the content transitioned to 'published' status"],
        ["publishedBy", "ObjectId (User)", "No", "Ref: User", "ID of the curator / admin who authorized publication"],
        ["createdBy", "ObjectId (User)", "Yes", "Ref: User", "ID of the administrator who created the initial draft"],
        ["updatedBy", "ObjectId (User)", "No", "Ref: User", "ID of the administrator who last modified the document"],
        ["active", "Boolean", "Yes", "Default: true", "Soft-deletion flag. Set to false when deleted via Admin API"],
        ["createdAt / updatedAt", "Date", "Yes (Auto)", "Mongoose timestamps", "Automatic audit timestamps"],
    ]
    create_styled_table(doc, base_headers, base_data, [1.4, 1.2, 0.8, 1.8, 2.4])

    # =========================================================================
    # 3. CATEGORY 1: HERITAGE & PLACES SCHEMA
    # =========================================================================
    h1 = doc.add_heading(level=1)
    r = h1.add_run("3. Category 1: Heritage & Places (heritage_places)")
    r.font.color.rgb = RGBColor(156, 66, 18)
    r.font.name = "Georgia"

    doc.add_paragraph(
        "Collection: heritage_places | Mongoose Model: HeritagePlace\n"
        "Description: Famous monuments, landmarks, fortresses, and architectural landmarks."
    )

    c1_headers = ["Field (inside fields.*)", "Type", "Required", "Options / Structure", "Description & Examples"]
    c1_data = [
        ["builtBy", "String", "No", "Text (Trimmed)", "Ruler, patron, dynasty, or builder (e.g. 'Holkar Dynasty', 'Mughal Empire')"],
        ["era", "String", "No", "Text (Trimmed)", "Historical era, construction year, or century (e.g. '1850 AD', '16th Century CE')"],
        ["entryFee", "Group (Sub-doc)", "No", "Group with domestic, foreign, student", "Visitor tariff structure with 3 distinct pricing tiers"],
        ["entryFee.domestic", "String / Number", "No", "Text / Currency", "Entry fee for Indian Citizens (e.g. '25' or 'Free')"],
        ["entryFee.foreign", "String / Number", "No", "Text / Currency", "Entry fee for Foreign Tourists (e.g. '300')"],
        ["entryFee.student", "String / Number", "No", "Text / Currency", "Concessional ticket price for Students (e.g. '15')"],
        ["timings", "String", "No", "Text (Trimmed)", "Public opening & closing hours (e.g. '09:00 AM - 06:00 PM (Closed Mondays)')"],
        ["rating", "Number", "No", "Float (0.0 - 5.0)", "Verified citizen visitor rating score"],
        ["reviewsCount", "String", "No", "Text (e.g. '1.2k')", "Display string of verified tourist reviews"],
        ["distanceKm", "Number", "No", "Float in Kilometers", "Calculated distance from district nodal center"],
        ["distanceDisplay", "String", "No", "Text (e.g. '2.5 km')", "Formatted badge string for card rendering"],
    ]
    create_styled_table(doc, c1_headers, c1_data, [1.5, 1.2, 0.8, 1.7, 2.4])

    # =========================================================================
    # 4. CATEGORY 2: HIDDEN PLACES SCHEMA
    # =========================================================================
    h1 = doc.add_heading(level=1)
    r = h1.add_run("4. Category 2: Hidden Places (hidden_places)")
    r.font.color.rgb = RGBColor(156, 66, 18)
    r.font.name = "Georgia"

    doc.add_paragraph(
        "Collection: hidden_places | Mongoose Model: HiddenPlace\n"
        "Description: Lesser-known heritage gems, secluded shrines, historic trails, and scenic waterfalls."
    )

    c2_headers = ["Field (inside fields.*)", "Type", "Required", "Options / Structure", "Description & Examples"]
    c2_data = [
        ["eventPeriod", "String", "No", "Text (Trimmed)", "Historic date or event window (e.g. '1857 Rebellion', 'Medieval Era')"],
        ["relatedPersonality", "String", "No", "Text (Trimmed)", "Historical or legendary hero (e.g. 'Tantya Bhil', 'Rani Durgavati')"],
        ["storyType", "String (Enum)", "No", "['Folklore', 'Historical Event', 'Legend', '']", "Classification of the historical tale or oral tradition"],
        ["rating", "Number", "No", "Float (0.0 - 5.0)", "Visitor rating score"],
        ["reviewsCount", "String", "No", "Text", "Count of reviews"],
        ["distanceKm", "Number", "No", "Float", "Distance in kilometers from district center"],
        ["distanceDisplay", "String", "No", "Text", "Formatted distance display"],
    ]
    create_styled_table(doc, c2_headers, c2_data, [1.5, 1.2, 0.8, 1.7, 2.4])

    # =========================================================================
    # 5. CATEGORY 3: CULTURE & TRADITIONS SCHEMA
    # =========================================================================
    h1 = doc.add_heading(level=1)
    r = h1.add_run("5. Category 3: Culture & Traditions (culture_traditions)")
    r.font.color.rgb = RGBColor(156, 66, 18)
    r.font.name = "Georgia"

    doc.add_paragraph(
        "Collection: culture_traditions | Mongoose Model: CultureTradition\n"
        "Description: Living spiritual traditions, regional festivals, sacred processions, and seasonal celebrations."
    )

    c3_headers = ["Field (inside fields.*)", "Type", "Required", "Options / Structure", "Description & Examples"]
    c3_data = [
        ["festivalDate", "String", "No", "Text (Trimmed)", "Traditional celebration date/month (e.g. 'Rang Panchami (Chaitra Month)')"],
        ["frequency", "String (Enum)", "No", "['Annual', 'Seasonal', 'One-time', '']", "Frequency of occurrence in the cultural calendar"],
        ["ritualType", "String", "No", "Text (Trimmed)", "Type of ritual or community congregation (e.g. 'Gair Procession', 'Aarti')"],
        ["rating", "Number", "No", "Float", "Rating score"],
        ["reviewsCount", "String", "No", "Text", "Review count label"],
        ["distanceKm", "Number", "No", "Float", "Distance in kilometers"],
    ]
    create_styled_table(doc, c3_headers, c3_data, [1.5, 1.2, 0.8, 1.7, 2.4])

    # =========================================================================
    # 6. CATEGORY 4: ARTS & FOLK SCHEMA
    # =========================================================================
    h1 = doc.add_heading(level=1)
    r = h1.add_run("6. Category 4: Arts & Folk (arts_folk)")
    r.font.color.rgb = RGBColor(156, 66, 18)
    r.font.name = "Georgia"

    doc.add_paragraph(
        "Collection: arts_folk | Mongoose Model: ArtFolk\n"
        "Description: Traditional performing arts, indigenous handicrafts, tribal paintings, music, and artisan guilds."
    )

    c4_headers = ["Field (inside fields.*)", "Type", "Required", "Options / Structure", "Description & Examples"]
    c4_data = [
        ["artFormType", "String (Enum)", "No", "['Music', 'Dance', 'Craft', 'Painting', '']", "Primary art category classification"],
        ["artisanCommunity", "String", "No", "Text (Trimmed)", "Practicing tribal community or artisanal guild (e.g. 'Bhil Artists', 'Weavers')"],
        ["origin", "String", "No", "Text (Trimmed)", "Geographical and cultural origin region (e.g. 'Malwa Plateau', 'Nimar Valley')"],
        ["rating", "Number", "No", "Float", "Rating score"],
        ["reviewsCount", "String", "No", "Text", "Review count label"],
        ["distanceKm", "Number", "No", "Float", "Distance in kilometers"],
    ]
    create_styled_table(doc, c4_headers, c4_data, [1.5, 1.2, 0.8, 1.7, 2.4])

    # =========================================================================
    # 7. CATEGORY 5: FOOD & MARKETS SCHEMA
    # =========================================================================
    h1 = doc.add_heading(level=1)
    r = h1.add_run("7. Category 5: Food & Markets (food_markets)")
    r.font.color.rgb = RGBColor(156, 66, 18)
    r.font.name = "Georgia"

    doc.add_paragraph(
        "Collection: food_markets | Mongoose Model: FoodMarket\n"
        "Description: Historic gastronomy, traditional recipes, iconic night markets, and ancient bazaars."
    )

    c5_headers = ["Field (inside fields.*)", "Type", "Required", "Options / Structure", "Description & Examples"]
    c5_data = [
        ["itemType", "String (Enum)", "No", "['Dish', 'Market', '']", "Whether the record describes an iconic cuisine dish or an entire market bazaar"],
        ["famousSince", "String", "No", "Text (Trimmed)", "Origin era or founding year (e.g. '1920s', 'Holkar Reign')"],
        ["whereToTry", "String", "No", "Text (Trimmed)", "Exact street / landmark destination (e.g. 'Sarafa Night Bazaar', 'Chappan Dukan')"],
        ["rating", "Number", "No", "Float", "Visitor rating score"],
        ["reviewsCount", "String", "No", "Text", "Review count label"],
        ["distanceKm", "Number", "No", "Float", "Distance in kilometers"],
    ]
    create_styled_table(doc, c5_headers, c5_data, [1.5, 1.2, 0.8, 1.7, 2.4])

    # =========================================================================
    # 8. EMBEDDED SUB-SCHEMAS (MEDIA, DOCUMENTS, SOURCES, GEOJSON)
    # =========================================================================
    h1 = doc.add_heading(level=1)
    r = h1.add_run("8. Embedded Sub-Schemas (Media, Documents, Sources, GeoJSON)")
    r.font.color.rgb = RGBColor(156, 66, 18)
    r.font.name = "Georgia"

    doc.add_paragraph("Each heritage document embeds rich structured media sub-documents validated by Mongoose:")

    doc.add_heading(level=2, text="8.1 Media Items Sub-Schema (media: [mediaItemSchema])")
    m_headers = ["Field", "Type", "Constraints", "Description"]
    m_data = [
        ["_id", "ObjectId", "Auto generated", "Unique identifier for this media element"],
        ["type", "String (Enum)", "['image', 'video', 'pdf', 'audio']", "Media format type. Default: 'image'"],
        ["url", "String", "Trimmed, URL format", "High-resolution image URL or direct MP4/YouTube video URL"],
        ["title", "String", "Trimmed", "Display title of the photograph, archival film, or sound clip"],
        ["caption", "String", "Trimmed", "Contextual architectural or historical caption"],
        ["alt", "String", "Trimmed", "Accessibility alt text for screen readers"],
        ["source", "String", "Trimmed", "Origin archive (e.g. 'ASI National Archive', 'State Museum')"],
        ["license", "String", "Trimmed", "Usage license (e.g. 'Public Domain', 'Government Open Data')"],
        ["displayOrder", "Number", "Default: 0", "Position index in the frontend media carousel"],
        ["active", "Boolean", "Default: true", "Visibility toggle for this individual media asset"],
    ]
    create_styled_table(doc, m_headers, m_data, [1.5, 1.4, 1.8, 2.9])

    doc.add_heading(level=2, text="8.2 Official Documents Sub-Schema (documents: [documentItemSchema])")
    d_headers = ["Field", "Type", "Constraints", "Description"]
    d_data = [
        ["_id", "ObjectId", "Auto generated", "Unique identifier for this document element"],
        ["title", "String", "Trimmed", "Document publication title (e.g. 'Imperial Gazetteer of Indore')"],
        ["type", "String", "Default: 'pdf'", "File format identifier ('pdf', 'epub', 'doc')"],
        ["url", "String", "Trimmed, Valid URL", "Download link to the PDF document or monograph"],
        ["author", "String", "Trimmed", "Historian, archaeologist, or committee author"],
        ["publisher", "String", "Trimmed", "Publishing agency (e.g. 'Archaeological Survey of India')"],
        ["displayOrder", "Number", "Default: 0", "Sort order in the monograph research library"],
        ["active", "Boolean", "Default: true", "Document status toggle"],
    ]
    create_styled_table(doc, d_headers, d_data, [1.5, 1.4, 1.8, 2.9])

    doc.add_heading(level=2, text="8.3 Citations & Sources Sub-Schema (sources: [sourceItemSchema])")
    s_headers = ["Field", "Type", "Constraints", "Description"]
    s_data = [
        ["_id", "ObjectId", "Auto generated", "Unique identifier for this source element"],
        ["sourceTitle", "String", "Trimmed", "Name of primary reference book, gazetteer, or website"],
        ["sourceUrl", "String", "Trimmed", "Hyperlink to online portal or official gazetteer page"],
        ["publisher", "String", "Trimmed", "Official publisher or state gazetteer department"],
        ["attribution", "String", "Trimmed", "Legal copyright attribution statement"],
        ["verificationNotes", "String", "Trimmed", "Administrative notes detailing how factual verification was conducted"],
    ]
    create_styled_table(doc, s_headers, s_data, [1.5, 1.4, 1.8, 2.9])

    # =========================================================================
    # 9. SYSTEM COLLECTIONS (STATES, CITIES, USERS, CATEGORIES, AUDIT)
    # =========================================================================
    h1 = doc.add_heading(level=1)
    r = h1.add_run("9. Administrative & Relational Schemas")
    r.font.color.rgb = RGBColor(156, 66, 18)
    r.font.name = "Georgia"

    doc.add_paragraph("In addition to the 5 content collections, Dharohar maintains relational jurisdiction, user role, and category isolation schemas:")

    rel_headers = ["Collection", "Model", "Key Schema Fields", "Relational Role"]
    rel_data = [
        ["states", "State", "_id, name, code, slug, description, location (GeoPoint), active", "Top-level administrative state jurisdiction (e.g. Madhya Pradesh, DL)"],
        ["districts", "City", "_id, stateId (Ref: State), name, slug, description, coverImage, coordinates {lat, lng}, active", "District / City entity containing all content records and category overrides"],
        ["districtcategories", "DistrictCategory", "_id, districtId (Ref: City), categorySlug, categoryId, enabled (Boolean), featured", "Per-district category toggle. Allows disabling a category for specific districts"],
        ["users", "User", "_id, name, email, password (bcrypt hash), role (Enum), stateId, cityId, state, district, active", "User authentication supporting 6 RBAC roles: super_admin, state_admin, district_admin, editor, reviewer, user"],
        ["auditlogs", "AuditLog", "_id, actor, actorEmail, actorRole, action, entity, entityId, summary, details, ip, userAgent", "Immutable security ledger recording every administrative Create, Update, Status Change, and Delete"],
    ]
    create_styled_table(doc, rel_headers, rel_data, [1.3, 1.2, 2.5, 2.6])

    # =========================================================================
    # 10. SAVE DOCUMENT
    # =========================================================================
    output_path = r"c:\Users\bhanp\OneDrive\Documents\SIH_all_projects\aryan_work\DHAROHAR\DHAROHAR\DHAROHAR_Category_Schemas_Specification.docx"
    doc.save(output_path)
    print(f"Word document generated successfully at: {output_path}")

    # Also save a copy in the artifact directory
    artifact_path = r"C:\Users\bhanp\.gemini\antigravity-ide\brain\181bfcf1-b858-40a4-953e-afd760dd609e\DHAROHAR_Category_Schemas_Specification.docx"
    doc.save(artifact_path)
    print(f"Artifact copy saved at: {artifact_path}")

if __name__ == "__main__":
    build_word_document()
