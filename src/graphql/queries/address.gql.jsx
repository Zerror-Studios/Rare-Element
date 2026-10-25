import { gql } from "@apollo/client";

export const GET_ADDRESSES = gql`
  query GetAddresses {
    getAddresses {
      _id
      firstname
      lastname
      email
      addressType
      flat
      addressline1
      addressline2
      landmark
      phone
      countryCode
      city
      country
      states
      pincode
      primary
      createdAt
      updatedAt
    }
  }
`;
