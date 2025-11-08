import { gql } from "@apollo/client";

export const GET_FUEL_DATA_BY_DATE = gql`
  query GetFuelDataByDate($date: date!) {
    fuel_dataCollection(filter: { date: { eq: $date } }) {
      edges {
        node {
          date
          percentage
        }
      }
    }
  }
`;

export const GET_RAINFALL_DATA_BY_DATE = gql`
  query GetRainfallDataByDate($date: date!) {
    rainfall_dataCollection(filter: { date: { eq: $date } }) {
      edges {
        node {
          date
          mm
        }
      }
    }
  }
`;

export const GET_TEMPERATURE_DATA_BY_DATE = gql`
  query GetTemperatureDataByDate($date: date!) {
    temperature_dataCollection(filter: { timestamp: { startsWith: $date } }) {
      edges {
        node {
          timestamp
          temperature
          humidity
        }
      }
    }
  }
`;
