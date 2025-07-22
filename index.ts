#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
	CallToolRequestSchema,
	ErrorCode,
	ListToolsRequestSchema,
	McpError,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE_URL = "https://api.subjct.ai";

interface SubjctConfig {
	apiKey?: string;
	secretKey?: string;
	organisationId?: string;
	propertyId?: string;
}

class SubjctServer {
	private server: Server;
	// private config: SubjctConfig;

	constructor() {
		// this.config = {
		//   apiKey: process.env.SUBJCT_API_KEY,
		//   secretKey: process.env.SUBJCT_SECRET_KEY,
		//   organisationId: process.env.SUBJCT_ORGANISATION_ID,
		//   propertyId: process.env.SUBJCT_PROPERTY_ID,
		// };

		this.server = new Server(
			{
				name: "subjct-api-server",
				version: "1.0.0",
			},
			{
				capabilities: {
					tools: {},
				},
			},
		);

		this.setupToolHandlers();

		// Error handling
		this.server.onerror = (error) => console.error("[MCP Error]", error);
		process.on("SIGINT", async () => {
			await this.server.close();
			process.exit(0);
		});
	}

	private async makeRequest(
		endpoint: string,
		method: "GET" | "POST" | "PUT" = "GET",
		body?: any,
		useSecretKey: boolean = false,
		customHeaders?: Record<string, string>,
	): Promise<any> {
		const url = `${API_BASE_URL}${endpoint}`;
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...customHeaders,
		};

		// if (useSecretKey && this.config.secretKey) {
		//   headers['X-Secret-Key'] = this.config.secretKey;
		// } else if (this.config.apiKey) {
		//   headers['Authorization'] = `Bearer ${this.config.apiKey}`;
		// }

		const response = await fetch(url, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`API request failed: ${response.status} ${response.statusText} - ${errorText}`,
			);
		}

		const contentType = response.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			return await response.json();
		}
		return await response.text();
	}

	private setupToolHandlers() {
		this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
			tools: [
				// Authentication tools
				{
					name: "login",
					description: "Login to SUBJCT API with email and password",
					inputSchema: {
						type: "object",
						properties: {
							email: {
								type: "string",
								format: "email",
								description: "User email",
							},
							password: { type: "string", description: "User password" },
						},
						required: ["email", "password"],
					},
				},
				{
					name: "signup",
					description: "Sign up for SUBJCT API",
					inputSchema: {
						type: "object",
						properties: {
							email: {
								type: "string",
								format: "email",
								description: "User email",
							},
							password: { type: "string", description: "User password" },
							orgName: {
								type: "string",
								description: "Organisation name (for new org)",
							},
							orgId: {
								type: "string",
								description: "Organisation ID (to join existing org)",
							},
						},
						required: ["email", "password"],
					},
				},

				// Organisation tools
				{
					name: "get_organisation",
					description: "Get organisation information",
					inputSchema: {
						type: "object",
						properties: {},
					},
				},
				{
					name: "get_organisation_users",
					description: "Get list of users in the organisation",
					inputSchema: {
						type: "object",
						properties: {
							page: { type: "integer", default: 1, description: "Page number" },
							size: { type: "integer", default: 20, description: "Page size" },
						},
					},
				},

				// Search tools
				{
					name: "search_articles",
					description: "Search for articles",
					inputSchema: {
						type: "object",
						properties: {
							query: { type: "string", description: "Search query" },
							properties: {
								type: "array",
								items: { type: "string" },
								description: "Property IDs to search in",
							},
							size: { type: "integer", description: "Number of results" },
							from: { type: "integer", description: "Offset for pagination" },
							organisationId: {
								type: "string",
								description: "Organisation ID (optional)",
							},
						},
						required: ["query"],
					},
				},
				{
					name: "search_topics_in_property",
					description: "Search for topics in a specific property",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							propertyId: { type: "string", description: "Property ID" },
							query: { type: "string", description: "Search query" },
							size: { type: "integer", description: "Number of results" },
							from: { type: "integer", description: "Offset for pagination" },
						},
						required: ["organisationId", "propertyId", "query"],
					},
				},
				{
					name: "search_article_by_url",
					description: "Search for article by URL",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							propertyId: { type: "string", description: "Property ID" },
							url: { type: "string", description: "Article URL" },
						},
						required: ["organisationId", "propertyId", "url"],
					},
				},

				// Article management tools
				{
					name: "add_article",
					description: "Add a new article to a property",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							propertyId: { type: "string", description: "Property ID" },
							article: {
								type: "object",
								properties: {
									externalId: { type: "string", description: "External ID" },
									url: { type: "string", description: "Article URL" },
									title: { type: "string", description: "Article title" },
									content: { type: "string", description: "Article content" },
									html: { type: "string", description: "Article HTML" },
									datePublished: {
										type: "string",
										description: "Publication date",
									},
									language: { type: "string", description: "Article language" },
									authors: {
										type: "array",
										items: {
											type: "object",
											properties: {
												name: { type: "string" },
												url: { type: "string" },
											},
										},
									},
									images: {
										type: "array",
										items: {
											type: "object",
											properties: {
												title: { type: "string" },
												alt: { type: "string" },
												url: { type: "string" },
											},
										},
									},
								},
								required: ["url", "title", "content"],
							},
						},
						required: ["organisationId", "propertyId", "article"],
					},
				},
				{
					name: "get_article_with_analysis",
					description: "Get article with analysis and links",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							propertyId: { type: "string", description: "Property ID" },
							articleId: { type: "string", description: "Article ID" },
						},
						required: ["organisationId", "propertyId", "articleId"],
					},
				},
				{
					name: "update_article",
					description: "Update an existing article",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							propertyId: { type: "string", description: "Property ID" },
							articleId: { type: "string", description: "Article ID" },
							article: {
								type: "object",
								properties: {
									title: { type: "string", description: "Article title" },
									content: { type: "string", description: "Article content" },
									html: { type: "string", description: "Article HTML" },
									url: { type: "string", description: "Article URL" },
								},
							},
						},
						required: ["organisationId", "propertyId", "articleId", "article"],
					},
				},
				{
					name: "get_similar_articles",
					description: "Get articles similar to a given article",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							propertyId: { type: "string", description: "Property ID" },
							articleId: { type: "string", description: "Article ID" },
						},
						required: ["organisationId", "propertyId", "articleId"],
					},
				},
				{
					name: "autolink_article",
					description: "Trigger auto-linking process for an article",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							propertyId: { type: "string", description: "Property ID" },
							articleId: { type: "string", description: "Article ID" },
						},
						required: ["organisationId", "propertyId", "articleId"],
					},
				},

				// Topic management tools
				{
					name: "add_topic",
					description: "Add a new topic to a property",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							propertyId: { type: "string", description: "Property ID" },
							topic: {
								type: "object",
								properties: {
									externalId: { type: "string", description: "External ID" },
									url: { type: "string", description: "Topic URL" },
									text: { type: "string", description: "Topic text" },
								},
								required: ["url", "text"],
							},
						},
						required: ["organisationId", "propertyId", "topic"],
					},
				},

				// Property management tools
				{
					name: "get_properties",
					description: "Get all properties for the authenticated organisation",
					inputSchema: {
						type: "object",
						properties: {},
					},
				},
				{
					name: "get_property_by_id",
					description: "Get a property by ID",
					inputSchema: {
						type: "object",
						properties: {
							id: { type: "string", description: "Property ID" },
						},
						required: ["id"],
					},
				},
				{
					name: "create_property",
					description: "Create a new property",
					inputSchema: {
						type: "object",
						properties: {
							property: {
								type: "object",
								properties: {
									target: {
										type: "object",
										properties: {
											name: { type: "string" },
											url: { type: "string" },
											type: { type: "string" },
										},
									},
								},
							},
						},
						required: ["property"],
					},
				},
				{
					name: "create_property_from_url",
					description: "Find or create a property for a given URL",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							url: {
								type: "string",
								description: "URL to create property from",
							},
						},
						required: ["organisationId", "url"],
					},
				},

				// Metrics tools
				{
					name: "get_organisation_metrics",
					description: "Get organisation-wide metrics",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
						},
						required: ["organisationId"],
					},
				},
				{
					name: "get_property_metrics",
					description: "Get property-level metrics",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							propertyId: { type: "string", description: "Property ID" },
						},
						required: ["organisationId", "propertyId"],
					},
				},
				{
					name: "get_article_metrics",
					description: "Get metrics for a specific article",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							propertyId: { type: "string", description: "Property ID" },
							articleId: { type: "string", description: "Article ID" },
						},
						required: ["organisationId", "propertyId", "articleId"],
					},
				},

				// Analysis tools
				{
					name: "get_article_analysis",
					description: "Get article analysis results",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							propertyId: { type: "string", description: "Property ID" },
							articleId: { type: "string", description: "Article ID" },
						},
						required: ["organisationId", "propertyId", "articleId"],
					},
				},
				{
					name: "get_article_links",
					description: "Get article links results",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							propertyId: { type: "string", description: "Property ID" },
							articleId: { type: "string", description: "Article ID" },
						},
						required: ["organisationId", "propertyId", "articleId"],
					},
				},
				{
					name: "trigger_jsonld_generation",
					description: "Trigger JSON-LD generation for an article",
					inputSchema: {
						type: "object",
						properties: {
							organisationId: {
								type: "string",
								description: "Organisation ID",
							},
							propertyId: { type: "string", description: "Property ID" },
							articleId: { type: "string", description: "Article ID" },
						},
						required: ["organisationId", "propertyId", "articleId"],
					},
				},
			],
		}));

		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const { name, arguments: args } = request.params;

			try {
				switch (name) {
					case "login":
						return await this.handleLogin(args);
					case "signup":
						return await this.handleSignup(args);
					case "get_organisation":
						return await this.handleGetOrganisation();
					case "get_organisation_users":
						return await this.handleGetOrganisationUsers(args);
					case "search_articles":
						return await this.handleSearchArticles(args);
					case "search_topics_in_property":
						return await this.handleSearchTopicsInProperty(args);
					case "search_article_by_url":
						return await this.handleSearchArticleByUrl(args);
					case "add_article":
						return await this.handleAddArticle(args);
					case "get_article_with_analysis":
						return await this.handleGetArticleWithAnalysis(args);
					case "update_article":
						return await this.handleUpdateArticle(args);
					case "get_similar_articles":
						return await this.handleGetSimilarArticles(args);
					case "autolink_article":
						return await this.handleAutolinkArticle(args);
					case "add_topic":
						return await this.handleAddTopic(args);
					case "get_properties":
						return await this.handleGetProperties();
					case "get_property_by_id":
						return await this.handleGetPropertyById(args);
					case "create_property":
						return await this.handleCreateProperty(args);
					case "create_property_from_url":
						return await this.handleCreatePropertyFromUrl(args);
					case "get_organisation_metrics":
						return await this.handleGetOrganisationMetrics(args);
					case "get_property_metrics":
						return await this.handleGetPropertyMetrics(args);
					case "get_article_metrics":
						return await this.handleGetArticleMetrics(args);
					case "get_article_analysis":
						return await this.handleGetArticleAnalysis(args);
					case "get_article_links":
						return await this.handleGetArticleLinks(args);
					case "trigger_jsonld_generation":
						return await this.handleTriggerJsonLdGeneration(args);
					default:
						throw new McpError(
							ErrorCode.MethodNotFound,
							`Unknown tool: ${name}`,
						);
				}
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error: ${error instanceof Error ? error.message : String(error)}`,
						},
					],
					isError: true,
				};
			}
		});
	}

	// Tool handlers
	private async handleLogin(args: any) {
		const result = await this.makeRequest("/auth/login", "POST", args);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleSignup(args: any) {
		const result = await this.makeRequest("/auth/signup", "POST", args);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleGetOrganisation() {
		const result = await this.makeRequest("/org");
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleGetOrganisationUsers(args: any) {
		const queryParams = new URLSearchParams();
		if (args.page) queryParams.append("page", args.page.toString());
		if (args.size) queryParams.append("size", args.size.toString());

		const result = await this.makeRequest(`/org/users?${queryParams}`);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleSearchArticles(args: any) {
		const endpoint = args.organisationId
			? `/search/${args.organisationId}/articles`
			: "/search/articles";

		const searchBody = {
			query: args.query,
			properties: args.properties,
			size: args.size,
			from: args.from,
		};

		const result = await this.makeRequest(endpoint, "POST", searchBody);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleSearchTopicsInProperty(args: any) {
		const endpoint = `/search/${args.organisationId}/${args.propertyId}/topics`;
		const searchBody = {
			query: args.query,
			size: args.size,
			from: args.from,
		};

		const result = await this.makeRequest(endpoint, "POST", searchBody);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleSearchArticleByUrl(args: any) {
		const endpoint = `/search/${args.organisationId}/${args.propertyId}/articles`;
		const result = await this.makeRequest(endpoint, "POST", { url: args.url });
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleAddArticle(args: any) {
		const endpoint = `/ingest/${args.organisationId}/${args.propertyId}/article`;
		const result = await this.makeRequest(endpoint, "POST", args.article, true);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleGetArticleWithAnalysis(args: any) {
		const endpoint = `/article/${args.organisationId}/${args.propertyId}/${args.articleId}`;
		const result = await this.makeRequest(endpoint, "GET", undefined, true);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleUpdateArticle(args: any) {
		const endpoint = `/article/${args.organisationId}/${args.propertyId}/${args.articleId}`;
		const result = await this.makeRequest(endpoint, "PUT", args.article, true);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleGetSimilarArticles(args: any) {
		const endpoint = `/article/${args.organisationId}/${args.propertyId}/${args.articleId}/similar_articles`;
		const result = await this.makeRequest(endpoint, "GET", undefined, true);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleAutolinkArticle(args: any) {
		const endpoint = `/autolink/${args.organisationId}/${args.propertyId}/${args.articleId}`;
		const result = await this.makeRequest(endpoint, "POST", undefined, true);
		return {
			content: [
				{
					type: "text",
					text: result || "Auto-linking triggered successfully",
				},
			],
		};
	}

	private async handleAddTopic(args: any) {
		const endpoint = `/ingest/${args.organisationId}/${args.propertyId}/topic`;
		const result = await this.makeRequest(endpoint, "POST", args.topic, true);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleGetProperties() {
		const result = await this.makeRequest("/property");
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleGetPropertyById(args: any) {
		const result = await this.makeRequest(`/property/${args.id}`);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleCreateProperty(args: any) {
		const result = await this.makeRequest("/property", "POST", args.property);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleCreatePropertyFromUrl(args: any) {
		const endpoint = `/property/${args.organisationId}/from/url`;
		const result = await this.makeRequest(
			endpoint,
			"POST",
			{ url: args.url },
			true,
		);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleGetOrganisationMetrics(args: any) {
		const endpoint = `/metrics/${args.organisationId}`;
		const result = await this.makeRequest(endpoint, "GET", undefined, true);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleGetPropertyMetrics(args: any) {
		const endpoint = `/metrics/${args.organisationId}/${args.propertyId}`;
		const result = await this.makeRequest(endpoint, "GET", undefined, true);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleGetArticleMetrics(args: any) {
		const endpoint = `/metrics/${args.organisationId}/${args.propertyId}/article/${args.articleId}`;
		const result = await this.makeRequest(endpoint, "GET", undefined, true);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleGetArticleAnalysis(args: any) {
		const endpoint = `/analysis/${args.organisationId}/${args.propertyId}/article/${args.articleId}`;
		const result = await this.makeRequest(endpoint, "GET", undefined, true);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleGetArticleLinks(args: any) {
		const endpoint = `/analysis/${args.organisationId}/${args.propertyId}/links/${args.articleId}`;
		const result = await this.makeRequest(endpoint, "GET", undefined, true);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	}

	private async handleTriggerJsonLdGeneration(args: any) {
		const endpoint = `/analysis/${args.organisationId}/${args.propertyId}/jsonLd/${args.articleId}`;
		const result = await this.makeRequest(endpoint, "POST", undefined, true);
		return {
			content: [
				{
					type: "text",
					text: result || "JSON-LD generation triggered successfully",
				},
			],
		};
	}

	async run() {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		console.error("SUBJCT MCP server running on stdio");
	}
}

const server = new SubjctServer();
server.run().catch(console.error);
