/*
* Generate all the ways to write N as a sum of M strictly positive integers
* E.g. compositions(5,3) = [[1,1,3],[1,2,2],[1,3,1],[2,1,2],[2,2,1],[3,1,1]]
*/
function compositions(N, M) {
    let results = [];

    // Function for recursion
    // Remaining is the remaining sum to be composed
    // Parts is the current composition being built
    function helper(remaining, parts) {
        // If we already have M parts and remaining is 0, we found a valid composition
        // and we add it to the results
        if (parts.length === M) {
            if (remaining === 0) results.push(parts);
            return;
        }

        // Each part must be at least 1
        // and we must leave enough remaining for the other parts (1 each so M - parts.length - 1)
        for (let i = 1; (remaining - i >= M - parts.length - 1); i++) {
            helper(remaining - i, [...parts, i]);
        }
    }

    helper(N, []);
    return results;
}