import { gql } from "@apollo/client";

export const GET_MY_PROFILE = gql`
  query GetMyProfile {
    getMyProfile {
      _id
      firstName
      lastName
      email
      phoneNumber
      countryCode
      gender
      profileImg
      dateOfBirth
      status
      addresses {
        _id
        addressType
        addressline1
        addressline2
        flat
        landmark
        countryCode
        phone
        city
        country
        states
        pincode
        primary
      }
    }
  }
`;
