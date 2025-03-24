module.exports = {
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['/node_modules/', '.tmp', '.cache'],
    collectCoverage: true,
    collectCoverageFrom: [
        'admin/src/**/*.js',
        'server/src/**/*.js',
    ],
}; 