import test from "node:test";
import assert from "node:assert/strict";
import { isSchoolEmail, cleanClassCode, cleanNick } from "../js/school.js";

const D = ["vinschool.edu.vn"];
test("only school emails pass", () => {
  assert.equal(isSchoolEmail("an.nguyen@vinschool.edu.vn", D), true);
  assert.equal(isSchoolEmail("AN@VINSCHOOL.EDU.VN ", D), true);
  assert.equal(isSchoolEmail("an@st.vinschool.edu.vn", D), true);          // subdomain of the school
  assert.equal(isSchoolEmail("an@gmail.com", D), false);
  assert.equal(isSchoolEmail("an@vinschool.edu.vn.evil.com", D), false);   // look-alike domain
  assert.equal(isSchoolEmail("an@notvinschool.edu.vn", D), false);
  assert.equal(isSchoolEmail("vinschool.edu.vn", D), false);
  assert.equal(isSchoolEmail("", D), false);
  assert.equal(isSchoolEmail(null, D), false);
});
test("class codes and nicknames are cleaned", () => {
  assert.equal(cleanClassCode(" hk7a24 "), "HK7A24");
  assert.equal(cleanClassCode("HK7-A24"), "HK7A24");
  assert.equal(cleanClassCode("ABC"), "");
  assert.equal(cleanNick("Mango Comet"), "MangoComet");
  assert.equal(cleanNick("a"), "");
  assert.equal(cleanNick("<b>x</b>"), "bxb");
});
