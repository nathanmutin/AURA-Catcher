/**
 * Generate all the ways to write N as a sum of M strictly positive integers
 * E.g. compositions(5,3) = [[1,1,3],[1,2,2],[1,3,1],[2,1,2],[2,2,1],[3,1,1]]
 */
export function compositions(N: number, M: number): number[][] {
    const results: number[][] = [];

    // Function for recursion
    // Remaining is the remaining sum to be composed
    // Parts is the current composition being built
    function helper(remaining: number, parts: number[]) {
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

export interface WrappedText {
    fontSize: number;
    lines: string[];
}

export function wrapText(text: string, maxFontSize: number = 0.09): WrappedText {
    let fontSize = maxFontSize;
    let lines: string[] = [];

    // Isolate each word, we won't cut words in two
    const words = text.split(' ');

    // We try 1, 2, .. 5 lines
    for (let nLines = 1; nLines <= 5; nLines++) {
        // We need at least one word per line (i.e. nLines words)
        if (words.length < nLines) break;

        // We try all possible ways to split the sentence into nLines lines
        // The best composition is defined by the composition with the smallest width 
        let bestComp: number[] | null = null;
        let bestLineLengths: number[] = Array(nLines).fill(Infinity);

        for (const comp of compositions(words.length, nLines)) {
            const lineLengths: number[] = [];
            for (let lineIdx = 0, wordIdx = 0; lineIdx < nLines; lineIdx++) {
                const line = words.slice(wordIdx, wordIdx + comp[lineIdx]).join(' ');
                lineLengths.push(line.length);
                wordIdx += comp[lineIdx];
            }

            // Sort line lengths in descending order for comparison
            // We want to minimize the max length (and subsequent lengths)
            const sortedLengths = [...lineLengths].sort((a, b) => b - a);

            // Compare with best found so far
            let isBetter = false;
            for (let i = 0; i < nLines; i++) {
                if (sortedLengths[i] < bestLineLengths[i]) {
                    isBetter = true;
                    break;
                }
                if (sortedLengths[i] > bestLineLengths[i]) {
                    isBetter = false;
                    break;
                }
            }

            // First valid comp is better than nothing
            if (bestComp === null || isBetter) {
                bestComp = comp;
                bestLineLengths = sortedLengths;
            }
        }

        if (!bestComp) continue;

        // Build the lines from the best composition found
        lines = [];
        for (let lineIdx = 0, wordIdx = 0; lineIdx < nLines; lineIdx++) {
            const line = words.slice(wordIdx, wordIdx + bestComp[lineIdx]).join(' ');
            lines.push(line);
            wordIdx += bestComp[lineIdx];
        }

        // Find the font size that fits the longest line
        const maxLineLen = bestLineLengths[0];
        fontSize = maxFontSize * 19 / maxLineLen;

        // How many lines can we fit with this font size? = 2.6 / (fontSize / maxFontSize) 
        // If it is more than nLines, we add one line, otherwise we found our solution
        if (Math.floor(2.6 * maxFontSize / fontSize) <= nLines || nLines === 5) {
            fontSize = Math.min(fontSize, maxFontSize, maxFontSize * 2.6 / nLines);
            break;
        }
    }

    return {
        fontSize,
        lines
    };
}
