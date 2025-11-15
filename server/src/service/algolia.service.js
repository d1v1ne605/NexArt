// Algolia Search Service (Search engine)
import { algoliasearch } from 'algoliasearch';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_WRITE_API_KEY = process.env.ALGOLIA_WRITE_API_KEY;

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);

export async function saveObjects({ indexName, objects }) {
    try {
        return await client.saveObjects({ indexName: indexName, objects: objects });
    } catch (error) {
        console.error(`Error saving objects to index "${indexName}":`, error);
        throw error;
    }
}

/**
 * @dev Partially update fields of an object by objectID
 * @param {string} indexName - Algolia index name
 * @param {Object} partialObject - Object with objectID and fields to update
 */
export async function partialUpdateObject({ indexName, objectID, partialObject }) {
    try {
        // Only fields in partialObject will be updated
        return await client.partialUpdateObject({ indexName: indexName, objectID: objectID, attributesToUpdate: partialObject });
    } catch (error) {
        console.error(`Error partial updating object in "${indexName}":`, error);
        throw error;
    }
}

/**
 * @dev Checks if an item exists in the specified Algolia index by objectID.
 * @param {string} indexName - Algolia index name
 * @param {string} objectID - The objectID to check
 * @returns {Promise<boolean>} - True if exists, false otherwise
 */
export async function itemExists({ indexName, objectID }) {
    try {
        const result = await client.getObject({ indexName: indexName, objectID: objectID });
        return !!result;
    } catch (error) {
        if (error.status === 404) return false;
        console.error(`Error checking existence of object "${objectID}" in "${indexName}":`, error);
        throw error;
    }
}