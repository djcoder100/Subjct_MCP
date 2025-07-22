# SUBJCT MCP Server

see : https://github.com/Systerr/Subjct_MCP

## Objective
Develop a Model Context Protocol (MCP) server using SUBJCT's provided API endpoints to demonstrate capabilities and solve real-world content optimisation challenges via an agentic delivery method.

See: https://modelcontextprotocol.io/introduction

## Scope
- Use Subjct's API endpoints to build a functioning MCP server within the 4-hour timeframe.
- Focus on transforming content from a CMS (e.g., Shopify or WordPress) for optimisation:
  - Add relevant links, tags, and schema.
  - Integrate knowledge graph data.
  - Ensure compatibility with existing SUBJCT functionalities.

## Requirements
- Utilise provided Swagger documentation and test account access.
- Deliver a proof of concept showcasing seamless API integration.
- Highlight how the solution can optimise articles for increased LLM mentions.
- Show the MCP server plugged in to Claude, ChatGPT or Google ADK to demonstrate functionality

## Resources Provided
- Test account credentials. Sign up using this link.
- SUBJCT API documentation (Swagger): https://api.subjct.ai/docs/swagger/
- After signing up, access the keys in the config area.
- [MCP Server Quickstart](https://modelcontextprotocol.io/quickstart)
- [Using LLMs to generate MCP server](https://modelcontextprotocol.io/llms-txt)
- [MCP + Google ADK](https://modelcontextprotocol.io/clients/google-adk)

## Deliverables
- A working MCP server prototype.
- Documentation and a brief presentation demonstrating functionality.
- Suggestions for scaling the solution or next steps.

## Evaluation Criteria
- Functionality and completeness of the MCP server.
- Effective utilisation of SUBJCT API.
- Potential for real-world application and scalability.
- Creativity and problem-solving approach.
- Going the extra mile to illustrate the power of MCP servers when bundled together (e.g. a demo illustrating your SUBJCT MCP server combined with Shopify/Wordpress CMS MCP server within Claude/ChatGPT)

## Development Notes

### Example Article for Testing
Use the following article for testing: https://emmajaneknight.com/blogs/news

### API Documentation
SUBJCT Swagger Documentation: https://api.subjct.ai/docs/swagger/ 

### References 

* https://emmajaneknight.com/blogs/news/juicing-the-2025-creative-comfort-zone
* 


## Install

```json
    "subjct": {
      "command": "{FULL_PATH}/node",
      "args": ["{FULL_PATH}/index.ts"],
      "env": {
      }
    }

```