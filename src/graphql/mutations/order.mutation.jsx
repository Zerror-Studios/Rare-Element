import { gql } from "@apollo/client";

// PRD-015 FR-20: shopper cancel and returns. The server re-checks every
// rule (own order, store policy, window, quantities); the page only shows
// what `canCancel` / `returnableItems` allow.

export const CANCEL_MY_ORDER = gql`
  mutation CancelMyOrder($orderId: ID!, $reason: String) {
    cancelMyOrder(orderId: $orderId, reason: $reason) {
      _id
      displayStatus
      canCancel
      cancelReason
    }
  }
`;

export const CREATE_RETURN_REQUEST = gql`
  mutation CreateReturnRequest($input: CreateReturnRequestInput!) {
    createReturnRequest(input: $input) {
      id
      status
    }
  }
`;

export const CANCEL_MY_RETURN_REQUEST = gql`
  mutation CancelMyReturnRequest($id: ID!) {
    cancelMyReturnRequest(id: $id) {
      id
      status
    }
  }
`;
