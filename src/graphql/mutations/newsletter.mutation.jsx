import { gql } from "@apollo/client";

// Newsletter unsubscribe link (PRD-002 VCON-1). The server answers `true`
// whatever the email or token, so the result reveals nothing.
export const UNSUBSCRIBE_NEWSLETTER = gql`
  mutation UnsubscribeNewsletter($email: String!, $token: String) {
    unsubscribeNewsletter(email: $email, token: $token)
  }
`;
