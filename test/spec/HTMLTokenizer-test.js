/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, describe, beforeEach, afterEach, it, runs, waitsFor, expect, spyOn, xdescribe, jasmine */
/*unittests: HTML Tokenizer*/

define(function (require, exports, module) {
    "use strict";
    
    var Tokenizer = require("language/HTMLTokenizer").Tokenizer;
    
    describe("HTML Tokenizer", function () {
        it("should handle tags and text", function () {
            var t = new Tokenizer("<html><body>Hello</body></html>");
            expect(t.nextToken()).toEqual({
                type: "opentagname",
                contents: "html",
                start: 1,
                end: 5
            });
            expect(t.nextToken()).toEqual({
                type: "opentagend",
                contents: "",
                start: -1,
                end: 6
            });
            expect(t.nextToken()).toEqual({
                type: "opentagname",
                contents: "body",
                start: 7,
                end: 11
            });
            expect(t.nextToken()).toEqual({
                type: "opentagend",
                contents: "",
                start: -1,
                end: 12
            });
            expect(t.nextToken()).toEqual({
                type: "text",
                contents: "Hello",
                start: 12,
                end: 17
            });
            expect(t.nextToken()).toEqual({
                type: "closetag",
                contents: "body",
                start: 19,
                end: 23
            });
            expect(t.nextToken()).toEqual({
                type: "closetag",
                contents: "html",
                start: 26,
                end: 30
            });
        });
        
        it("should handle attributes", function () {
            var t = new Tokenizer("<div class='foo bar' style='baz: quux'></div>");
            expect(t.nextToken()).toEqual({
                type: "opentagname",
                contents: "div",
                start: 1,
                end: 4
            });
            expect(t.nextToken()).toEqual({
                type: "attribname",
                contents: "class",
                start: 5,
                end: 10
            });
            expect(t.nextToken()).toEqual({
                type: "attribvalue",
                contents: "foo bar",
                start: 12,
                end: 19
            });
            expect(t.nextToken()).toEqual({
                type: "attribname",
                contents: "style",
                start: 21,
                end: 26
            });
            expect(t.nextToken()).toEqual({
                type: "attribvalue",
                contents: "baz: quux",
                start: 28,
                end: 37
            });
            expect(t.nextToken()).toEqual({
                type: "opentagend",
                contents: "",
                start: -1,
                end: 39
            });
            expect(t.nextToken()).toEqual({
                type: "closetag",
                contents: "div",
                start: 41,
                end: 44
            });
            expect(t.nextToken()).toEqual(null);
        });
        
        it("should notify of explicit shorttags like <br/>", function () {
            var t = new Tokenizer("<p>hello<br/></p>");
            expect(t.nextToken()).toEqual({
                type: "opentagname",
                contents: "p",
                start: 1,
                end: 2
            });
            expect(t.nextToken()).toEqual({
                type: "opentagend",
                contents: "",
                start: -1,
                end: 3
            });
            expect(t.nextToken()).toEqual({
                type: "text",
                contents: "hello",
                start: 3,
                end: 8
            });
            expect(t.nextToken()).toEqual({
                type: "opentagname",
                contents: "br",
                start: 9,
                end: 11
            });
            expect(t.nextToken()).toEqual({
                type: "selfclosingtag",
                contents: "",
                start: -1,
                end: 13
            });
            expect(t.nextToken()).toEqual({
                type: "closetag",
                contents: "p",
                start: 15,
                end: 16
            });
        });
        
        describe("error cases", function () {
            function expectError(text, isError) {
                if (isError === undefined) {
                    isError = true;
                }
                var t = new Tokenizer(text),
                    token = t.nextToken();
                while (token) {
                    if (token.type === "error") {
                        if (!isError) {
                            expect("found an error token").toBe(false);
                        }
                        return;
                    }
                    token = t.nextToken();
                }
                if (isError) {
                    expect("found an error token").toBe(true);
                }
            }
            
            it("should not fail for a comment", function () {
                expectError("<!--a comment-->", false);
            });
            it("should not fail for a tag with a mix of attribute styles", function () {
                expectError("<goodtag goodname=goodvalue goodname='goodvalue' goodname=\"goodvalue\" goodemptyname attrwithspace = attrval></goodtag>", false);
            });
            it("should fail for an angle bracket before a tag", function () {
                expectError("<<notatag>");
            });
            it("should fail for an angle bracket in a tag", function () {
                expectError("<not<atag>");
            });
            it("should fail for an angle bracket before an attribute name", function () {
                expectError("<tag <notattr>");
            });
            it("should fail for an angle bracket in an attribute name", function () {
                expectError("<tag not<attr>");
            });
            it("should fail for an angle bracket before a value", function () {
                expectError("<tag attr=<notvalue>");
            });
            it("should fail for an angle bracket inside a value", function () {
                expectError("<tag attr=not<value>");
            });
            it("should fail for an angle bracket before a close tag", function () {
                expectError("</<notatag>");
            });
            it("should fail for an angle bracket in a close tag", function () {
                expectError("</not<atag>");
            });
            it("should fail for unclosed open tag at EOF", function () {
                expectError("<unclosedopentag");
            });
            it("should fail for unfinished attr at EOF", function () {
                expectError("<tag unfinishedattr=");
            });
            it("should fail for unfinished single-quoted value at EOF", function () {
                expectError("<tag attr='unfinishedval");
            });
            it("should fail for unfinished double-quoted value at EOF", function () {
                expectError("<tag attr=\"unfinishedval");
            });
        });
    });
});