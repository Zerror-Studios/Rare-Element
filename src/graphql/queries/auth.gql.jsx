import { gql } from "@apollo/client";

// User Login
export const LOGIN_USER = gql`
  query UserLogin($email: String!, $password: String!, $guestId: ID) {
    userLogin(email: $email, password: $password, guestId: $guestId) {
      accessToken
      refreshToken
      user {
        _id
        countryCode
        addresses {
          _id
          firstname
          lastname
          addressType
          addressline1
          addressline2
          userId
          flat
          landmark
          countryCode
          phone
          city
          country
          states
          pincode
          primary
          createdAt
          updatedAt
        }
        profileImg
        dateOfBirth
        email
        firstName
        lastName
        gender
        phoneNumber
        emailSubscribedStatus
        status
      }
    }
  }
`;
