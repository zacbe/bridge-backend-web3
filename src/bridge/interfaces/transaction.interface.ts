export enum TransactionStatus {
  Pending = 'PENDING',
  Burned = 'BURNED',
  Completed = 'COMPLETED',
}

export interface Transaction {
  id: string;
  userAddress: string;
  from: {
    network: string;
    transactionHash: string | null;
    timestamp: Date | null;
  };
  to: {
    network: string;
    transactionHash: string | null;
    timestamp: Date | null;
  };
  amount: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
}
