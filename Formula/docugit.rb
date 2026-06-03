# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.03_02.58.38_b68143"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.03_02.58.38_b68143/docugit-darwin-arm64"
      sha256 "13060a3c0b9260919d48aaf9ff622577e84fd8a054dda329687cc52fd8a7e909"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.03_02.58.38_b68143/docugit-darwin-amd64"
      sha256 "9967625f6af1ac318e1dd56c728981eb18c76751b726b713d5116f669de8a636"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.03_02.58.38_b68143/docugit-linux-arm64"
      sha256 "8a3cc887523f764733417f9b1693e65bfcf1f39c1005baf64d48a724bfb7f193"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.03_02.58.38_b68143/docugit-linux-amd64"
      sha256 "2f6beb1d0e99a864daf751c9b9fdb41475024455930d25767e23c8a8f740612d"
    end
  end

  def install
    if OS.mac?
      binary = Hardware::CPU.arm? ? "docugit-darwin-arm64" : "docugit-darwin-amd64"
    else
      binary = Hardware::CPU.arm? ? "docugit-linux-arm64" : "docugit-linux-amd64"
    end
    bin.install binary => "docugit"
  end

  test do
    system "#{bin}/docugit", "--version"
  end
end
