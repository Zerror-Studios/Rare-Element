import { gql } from "@apollo/client";

// Create Address
export const CREATE_ADDRESS = gql`
  mutation CreateAddress($input: AddressInput!) {
    createAddress(input: $input) {
      _id
      firstname
      lastname
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
    }
  }
`;

// Update Address
export const UPDATE_ADDRESS = gql`
  mutation UpdateAddress($addressId: ID!, $input: AddressInput!) {
    updateAddress(addressId: $addressId, input: $input) {
      _id
      firstname
      lastname
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
    }
  }
`;

// Delete Address
export const DELETE_ADDRESS = gql`
  mutation DeleteAddress($addressId: ID!) {
    deleteAddress(addressId: $addressId)
  }
`;
