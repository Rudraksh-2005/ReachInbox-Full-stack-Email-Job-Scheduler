import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

const INDEX_NAME = 'emails';

export const setupElasticsearch = async () => {
  try {
    const indexExists = await esClient.indices.exists({ index: INDEX_NAME });
    if (!indexExists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              subject: { type: 'text' },
              body: { type: 'text' },
              recipient: { type: 'keyword' },
              senderEmail: { type: 'keyword' },
              status: { type: 'keyword' },
            },
          },
        },
      });
      console.log('Elasticsearch index created');
    }
  } catch (error) {
    console.error('Failed to setup Elasticsearch', error);
  }
};

export const indexEmail = async (emailData: any) => {
  try {
    await esClient.index({
      index: INDEX_NAME,
      id: emailData.id,
      document: emailData,
    });
  } catch (error) {
    console.error('Failed to index email', error);
  }
};

export const searchEmails = async (query: string) => {
  try {
    const result = await esClient.search({
      index: INDEX_NAME,
      body: {
        query: {
          multi_match: {
            query,
            fields: ['subject', 'body', 'recipient'],
          },
        },
      },
    });
    return result.hits.hits.map((hit: any) => hit._source);
  } catch (error) {
    console.error('Failed to search emails', error);
    return [];
  }
};
