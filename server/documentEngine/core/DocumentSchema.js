/**
 * Truvora Enterprise Document Schema
 * Version 1.0
 * This schema is used by every document generator.
 */

export default class DocumentSchema {

    constructor() {this.id = "";

this.title = "";

this.subtitle = "";

this.author = "";

this.company = "Truvora Global AI";

this.department = "";

this.subject = "";

this.description = "";

this.category = "";

this.language = "en";

this.version = "1.0";

this.status = "Draft";

this.createdAt = new Date();

this.updatedAt = new Date();

this.sections = [];

this.tables = [];

this.images = [];

this.charts = [];

this.attachments = [];

this.references = [];

this.headers = {};

this.footers = {};

this.metadata = {};

this.styles = {};

this.settings = {};

    }

}