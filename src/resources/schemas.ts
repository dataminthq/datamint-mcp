import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Pre-registered canonical JSON schemas maintained by Datamint.
 */
export const REGISTERED_SCHEMAS: Record<string, Record<string, unknown>> = {
  ecommerce_item: {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "EcommerceItem",
    type: "object",
    properties: {
      title: { type: "string", description: "Product name or title" },
      price: { type: "number", description: "Current purchase price" },
      currency: { type: "string", description: "Three-letter ISO currency code (USD, EUR, etc.)" },
      original_price: { type: "number", description: "Original or strike-through price if discounted" },
      brand: { type: "string", description: "Brand or manufacturer" },
      sku: { type: "string", description: "Stock keeping unit or identifier" },
      availability: {
        type: "string",
        enum: ["in_stock", "out_of_stock", "preorder", "unknown"],
        description: "Stock availability status",
      },
      description: { type: "string", description: "Detailed item description" },
      images: {
        type: "array",
        items: { type: "string", format: "uri" },
        description: "List of product image URLs",
      },
      rating: { type: "number", description: "Average review rating (out of 5.0)" },
      review_count: { type: "integer", description: "Total number of customer reviews" },
      specs: {
        type: "object",
        additionalProperties: { type: "string" },
        description: "Key-value technical specifications",
      },
    },
    required: ["title", "price"],
  },

  article: {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Article",
    type: "object",
    properties: {
      headline: { type: "string", description: "Article headline or title" },
      author: { type: "string", description: "Author name" },
      published_date: { type: "string", description: "Publication timestamp in ISO 8601" },
      modified_date: { type: "string", description: "Last updated timestamp" },
      publisher: { type: "string", description: "Publishing organization or website" },
      summary: { type: "string", description: "Executive summary or abstract" },
      body_text: { type: "string", description: "Main article body content" },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Article categories or tags",
      },
      image_url: { type: "string", format: "uri", description: "Hero or banner image URL" },
    },
    required: ["headline", "body_text"],
  },

  job_posting: {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "JobPosting",
    type: "object",
    properties: {
      title: { type: "string", description: "Job position title" },
      company: { type: "string", description: "Hiring company name" },
      location: { type: "string", description: "Office location or Remote status" },
      is_remote: { type: "boolean", description: "Whether this role is fully remote" },
      employment_type: {
        type: "string",
        enum: ["full_time", "part_time", "contract", "internship", "other"],
      },
      salary_min: { type: "number", description: "Minimum salary" },
      salary_max: { type: "number", description: "Maximum salary" },
      salary_currency: { type: "string", description: "Currency code (USD, EUR, GBP, etc.)" },
      description: { type: "string", description: "Full job description" },
      responsibilities: {
        type: "array",
        items: { type: "string" },
        description: "Key responsibilities",
      },
      requirements: {
        type: "array",
        items: { type: "string" },
        description: "Required skills and experience",
      },
      benefits: {
        type: "array",
        items: { type: "string" },
        description: "Company benefits and perks",
      },
      posted_date: { type: "string", description: "Date posted in ISO 8601" },
    },
    required: ["title", "company", "description"],
  },

  company_profile: {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "CompanyProfile",
    type: "object",
    properties: {
      name: { type: "string", description: "Legal or commercial company name" },
      domain: { type: "string", description: "Official company website domain" },
      tagline: { type: "string", description: "Company one-line elevator pitch" },
      description: { type: "string", description: "Comprehensive company overview" },
      headquarters: { type: "string", description: "Headquarters city and country" },
      founded_year: { type: "integer", description: "Year founded" },
      employee_count_range: { type: "string", description: "E.g. 11-50, 51-200, 1000+" },
      industries: {
        type: "array",
        items: { type: "string" },
        description: "Operating sectors and industry categories",
      },
      social_links: {
        type: "object",
        properties: {
          linkedin: { type: "string" },
          twitter: { type: "string" },
          github: { type: "string" },
        },
      },
      leadership: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
          },
        },
      },
    },
    required: ["name", "description"],
  },

  real_estate_listing: {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "RealEstateListing",
    type: "object",
    properties: {
      address: { type: "string", description: "Full street address" },
      price: { type: "number", description: "Listing sale or rental price" },
      currency: { type: "string", description: "Currency code" },
      bedrooms: { type: "number", description: "Number of bedrooms" },
      bathrooms: { type: "number", description: "Number of bathrooms" },
      square_feet: { type: "number", description: "Interior square footage" },
      property_type: { type: "string", description: "Single family, condo, townhouse, etc." },
      description: { type: "string", description: "Property listing description" },
      features: { type: "array", items: { type: "string" } },
      images: { type: "array", items: { type: "string", format: "uri" } },
    },
    required: ["address", "price"],
  },

  faq: {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "FAQ",
    type: "object",
    properties: {
      title: { type: "string", description: "FAQ page title or topic" },
      qa_pairs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
          required: ["question", "answer"],
        },
      },
    },
    required: ["qa_pairs"],
  },
};

export function registerSchemaResources(server: McpServer): void {
  // Static resource listing all available schemas
  server.registerResource(
    "registered_schemas_catalog",
    "datamint://schemas",
    {
      title: "Datamint Registered Schemas Catalog",
      description: "List of all maintained, pre-mapped JSON Schemas available for datamint_extract and datamint_mint.",
      mimeType: "application/json",
    },
    async (uri) => {
      const summary = Object.entries(REGISTERED_SCHEMAS).map(([name, schema]) => ({
        name,
        title: schema.title,
        uri: `datamint://schemas/${name}`,
        required_fields: schema.required,
      }));

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    },
  );

  // Dynamic template resource for reading a specific schema
  server.registerResource(
    "registered_schema_definition",
    new ResourceTemplate("datamint://schemas/{name}", { list: undefined }),
    {
      title: "Registered Schema Definition",
      description: "Full JSON Schema definition for a registered schema name.",
      mimeType: "application/json",
    },
    async (uri, { name }) => {
      const schemaName = String(name);
      const schema = REGISTERED_SCHEMAS[schemaName];

      if (!schema) {
        throw new Error(
          `Unknown schema '${schemaName}'. Available schemas: ${Object.keys(REGISTERED_SCHEMAS).join(", ")}`,
        );
      }

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(schema, null, 2),
          },
        ],
      };
    },
  );
}
