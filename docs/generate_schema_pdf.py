#!/usr/bin/env python3
"""Parse all TypeORM entity files and generate a clean PDF with tables."""

import re
import glob
import os
from fpdf import FPDF

MODULES = {
    "CRM Core": "apps/api/src/modules/crm/entities",
    "Marketing": "apps/api/src/modules/marketing/entities",
    "Service": "apps/api/src/modules/service/entities",
    "Content": "apps/api/src/modules/content/entities",
    "Sales": "apps/api/src/modules/sales/entities",
    "Commerce": "apps/api/src/modules/commerce/entities",
    "Data & Analytics": "apps/api/src/modules/data/entities",
    "Integrations": "apps/api/src/modules/integrations/entities",
    "Audit (Shared)": "apps/api/src/shared/audit/entities",
    "Notifications (Shared)": "apps/api/src/shared/notifications/entities",
}


def parse_entity(filepath):
    """Extract table name, columns, indexes, and relations from a TypeORM entity file."""
    with open(filepath) as f:
        content = f.read()

    # Table name
    m = re.search(r"@Entity\(['\"](\w+)['\"]\)", content)
    table_name = m.group(1) if m else os.path.basename(filepath).replace(".entity.ts", "")

    # Indexes
    indexes = []
    for m in re.finditer(r"@Index\(['\"]([^'\"]+)['\"]", content):
        indexes.append(m.group(1))
    for m in re.finditer(r"@Unique\(\[([^\]]+)\]", content):
        indexes.append(f"UNIQUE({m.group(1).strip()})")

    # Columns
    columns = []
    lines = content.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Detect column decorators
        col_type = None
        col_opts = {}

        if line.startswith("@PrimaryGeneratedColumn"):
            col_type = "PK"
            m = re.search(r"@PrimaryGeneratedColumn\(['\"]?(uuid|increment)?['\"]?\)", line)
            col_opts["pk_type"] = m.group(1) if m and m.group(1) else "increment"
        elif line.startswith("@Column"):
            col_type = "Column"
            col_opts = parse_column_decorator(line, lines, i)
        elif line.startswith("@CreateDateColumn"):
            col_type = "Column"
            col_opts = parse_column_decorator(line, lines, i)
            col_opts["auto"] = "create_timestamp"
        elif line.startswith("@UpdateDateColumn"):
            col_type = "Column"
            col_opts = parse_column_decorator(line, lines, i)
            col_opts["auto"] = "update_timestamp"
        elif line.startswith("@DeleteDateColumn"):
            col_type = "Column"
            col_opts = parse_column_decorator(line, lines, i)
            col_opts["auto"] = "soft_delete"

        if col_type:
            # Find the property name on the next non-decorator line
            j = i + 1
            while j < len(lines):
                prop_line = lines[j].strip()
                if prop_line.startswith("@"):
                    j += 1
                    continue
                prop_match = re.match(r"(\w+)[\?!]?\s*:\s*(.+);?", prop_line)
                if prop_match:
                    prop_name = prop_match.group(1)
                    ts_type = prop_match.group(2).rstrip(";").strip()
                    db_col = col_opts.get("name", to_snake_case(prop_name))
                    db_type = col_opts.get("type", infer_db_type(ts_type, col_type, col_opts))
                    nullable = col_opts.get("nullable", False)
                    default = col_opts.get("default", None)
                    auto = col_opts.get("auto", None)

                    notes = []
                    if col_type == "PK":
                        notes.append(f"PK ({col_opts.get('pk_type', 'uuid')})")
                    if nullable:
                        notes.append("nullable")
                    if default is not None:
                        notes.append(f"default: {default}")
                    if auto:
                        notes.append(auto)
                    if col_opts.get("unique"):
                        notes.append("unique")
                    if col_opts.get("array"):
                        notes.append("array")

                    columns.append({
                        "column": db_col,
                        "type": db_type,
                        "nullable": "YES" if nullable else "NO",
                        "notes": ", ".join(notes) if notes else "",
                    })
                break
            i = j + 1
            continue
        i += 1

    # Relations
    relations = []
    for m in re.finditer(r"@(ManyToOne|OneToMany|OneToOne|ManyToMany)\(\(\)\s*=>\s*(\w+)", content):
        rel_type = m.group(1)
        target = m.group(2)
        # Find JoinColumn
        pos = m.end()
        jc = re.search(r"@JoinColumn\(\{\s*name:\s*['\"](\w+)['\"]", content[pos:pos+200])
        fk = jc.group(1) if jc else None
        relations.append({"type": rel_type, "target": target, "fk": fk})

    return {
        "table": table_name,
        "file": filepath,
        "columns": columns,
        "indexes": indexes,
        "relations": relations,
    }


def parse_column_decorator(line, lines, i):
    """Parse @Column({...}) options, handling multi-line."""
    # Gather full decorator text
    text = line
    if "{" in text and "}" not in text:
        j = i + 1
        while j < len(lines) and "}" not in text:
            text += " " + lines[j].strip()
            j += 1

    opts = {}
    m = re.search(r"name:\s*['\"](\w+)['\"]", text)
    if m:
        opts["name"] = m.group(1)
    m = re.search(r"type:\s*['\"](\w+)['\"]", text)
    if m:
        opts["type"] = m.group(1)
    if "nullable: true" in text or "nullable:true" in text:
        opts["nullable"] = True
    m = re.search(r"default:\s*([^,\}]+)", text)
    if m:
        opts["default"] = m.group(1).strip().strip("'\"")
    if "unique: true" in text or "unique:true" in text:
        opts["unique"] = True
    if "array: true" in text or "array:true" in text:
        opts["array"] = True
    return opts


def to_snake_case(name):
    s = re.sub(r"([A-Z])", r"_\1", name).lower().lstrip("_")
    return s


def infer_db_type(ts_type, col_type, opts):
    if col_type == "PK":
        return "uuid" if opts.get("pk_type") == "uuid" else "integer"
    ts = ts_type.lower().replace("[]", "")
    if "string" in ts:
        return "varchar"
    if "number" in ts:
        return "integer"
    if "boolean" in ts:
        return "boolean"
    if "date" in ts:
        return "timestamp"
    if "record" in ts or "any" in ts or "object" in ts:
        return "jsonb"
    return "varchar"


class SchemaPDF(FPDF):
    def __init__(self):
        super().__init__(orientation="L", unit="mm", format="A4")
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 5, "CRM Platform - Database Schema Reference", align="R", new_x="LMARGIN", new_y="NEXT")
        self.line(10, self.get_y(), self.w - 10, self.get_y())
        self.ln(2)

    def footer(self):
        self.set_y(-10)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(150, 150, 150)
        self.cell(0, 5, f"Page {self.page_no()}/{{nb}}", align="C")

    def module_header(self, name, count):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(30, 60, 120)
        self.cell(0, 12, f"{name} ({count} tables)", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(30, 60, 120)
        self.line(10, self.get_y(), 100, self.get_y())
        self.ln(4)

    def table_header(self, table_name):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(0, 0, 0)
        self.set_fill_color(30, 60, 120)
        self.set_text_color(255, 255, 255)
        self.cell(0, 8, f"  {table_name}", fill=True, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)

    def column_table(self, columns):
        col_widths = [60, 30, 18, 169]  # column, type, nullable, notes  (total ~277 for landscape A4)
        headers = ["Column", "Type", "Null?", "Notes"]

        # Header row
        self.set_font("Helvetica", "B", 8)
        self.set_fill_color(220, 225, 235)
        for w, h in zip(col_widths, headers):
            self.cell(w, 6, f"  {h}", border=1, fill=True)
        self.ln()

        # Data rows
        self.set_font("Helvetica", "", 7.5)
        fill = False
        for col in columns:
            if self.get_y() > self.h - 20:
                self.add_page()
            if fill:
                self.set_fill_color(245, 247, 250)
            else:
                self.set_fill_color(255, 255, 255)

            self.cell(col_widths[0], 5.5, f"  {col['column']}", border="LTB", fill=True)
            self.cell(col_widths[1], 5.5, f"  {col['type']}", border="TB", fill=True)
            self.cell(col_widths[2], 5.5, f"  {col['nullable']}", border="TB", fill=True)
            self.cell(col_widths[3], 5.5, f"  {col['notes']}", border="TBR", fill=True)
            self.ln()
            fill = not fill

    def relations_section(self, relations):
        if not relations:
            return
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(80, 80, 80)
        self.cell(0, 5, "  Relations:", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 7.5)
        for rel in relations:
            fk_text = f" (FK: {rel['fk']})" if rel['fk'] else ""
            self.cell(0, 4.5, f"    {rel['type']} -> {rel['target']}{fk_text}", new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)

    def indexes_section(self, indexes):
        if not indexes:
            return
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(80, 80, 80)
        self.cell(0, 5, "  Indexes:", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 7)
        for idx in indexes:
            self.cell(0, 4, f"    {idx}", new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)


def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")

    pdf = SchemaPDF()
    pdf.alias_nb_pages()

    # Title page
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(30, 60, 120)
    pdf.ln(40)
    pdf.cell(0, 15, "CRM Platform", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 20)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 12, "Complete Database Schema Reference", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 12)
    pdf.cell(0, 8, "72 Tables across 10 Modules", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, "PostgreSQL 16 + TypeORM", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(20)

    # Table of contents
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(30, 60, 120)
    pdf.cell(0, 10, "Modules", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    all_parsed = {}
    total = 0
    for module_name, path in MODULES.items():
        entity_files = sorted(glob.glob(os.path.join(path, "*.entity.ts")))
        if not entity_files:
            continue
        parsed = [parse_entity(f) for f in entity_files]
        all_parsed[module_name] = parsed
        total += len(parsed)

        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(0, 0, 0)
        table_names = ", ".join(p["table"] for p in parsed)
        pdf.cell(0, 7, f"  {module_name} ({len(parsed)}): {table_names}", new_x="LMARGIN", new_y="NEXT")

    # Each module
    for module_name, parsed_list in all_parsed.items():
        pdf.add_page()
        pdf.module_header(module_name, len(parsed_list))

        for entity in parsed_list:
            # Check if we need a new page (need ~30mm minimum for header + a few rows)
            if pdf.get_y() > pdf.h - 40:
                pdf.add_page()

            pdf.table_header(entity["table"])
            if entity["columns"]:
                pdf.column_table(entity["columns"])
            pdf.indexes_section(entity["indexes"])
            pdf.relations_section(entity["relations"])
            pdf.ln(5)

    pdf.output("docs/DATABASE_SCHEMA.pdf")
    print(f"Generated docs/DATABASE_SCHEMA.pdf with {total} tables, {pdf.page_no()} pages")


if __name__ == "__main__":
    main()
