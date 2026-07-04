// Auto-mock: replaces every EventStore method with a no-op jest.fn()
// so OrderBook tests run without a real database

const EventStore = {
    orderPlaced: jest.fn().mockResolvedValue(undefined),
    orderPartial: jest.fn().mockResolvedValue(undefined),
    orderFilled: jest.fn().mockResolvedValue(undefined),
    orderCancelled: jest.fn().mockResolvedValue(undefined),
    tradeFired: jest.fn().mockResolvedValue(undefined),
    persistMatchResult: jest.fn().mockResolvedValue(undefined),
    getOpenOrderEvents: jest.fn().mockResolvedValue([]),
    disconnect: jest.fn().mockResolvedValue(undefined),
};

export { EventStore };
