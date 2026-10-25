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
      emailSubscribedStatus
    }
  }
`;
