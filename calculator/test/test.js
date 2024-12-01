const { parseFormula } = require('../app'); // 引入主逻辑模块
require('should'); // 引入 should 断言库

describe('parseFormula', () => {
    it('should correctly calculate (x + y) * z', () => {
        const formula = '(x + y) * z';
        const data = { x: 0.1, y: 0.2, z: 1 };

        const result = parseFormula(formula, data);
		console.log(result);
        result.should.be.approximately(0.3, 0.0001); // 浮点数近似比较
    });

    it('should correctly handle nested parentheses', () => {
        const formula = '((a + b) * c) - d';
        const data = { a: 2, b: 3, c: 4, d: 5 };

        const result = parseFormula(formula, data);

        result.should.equal(15); // ((2+3)*4)-5 = 15
    });

    it('should throw an error for undefined variables', () => {
        const formula = 'x + y';
        const data = { x: 1 }; // 缺少 y

        (() => parseFormula(formula, data)).should.throw(); // 预期抛出错误
    });

    it('should handle complex formulas', () => {
        const formula = 'x * y / (z - w)';
        const data = { x: 10, y: 2, z: 5, w: 3 };

        const result = parseFormula(formula, data);

        result.should.equal(10); // (10*2)/(5-3) = 10
    });
});
