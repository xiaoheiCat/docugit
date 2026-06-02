# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_14.25.57_256f89"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_14.25.57_256f89/docugit-darwin-arm64"
      sha256 "5772788e2f2b1c0f0cb0884118ca701b7103fb213c73fe06ac2e692fdc73f4f1"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_14.25.57_256f89/docugit-darwin-amd64"
      sha256 "e85f8f5a96f447a68995a8288768eb889fd4bc62393f3fe33e4b6a7e1370e3de"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_14.25.57_256f89/docugit-linux-arm64"
      sha256 "5542009c400ede55bfc43ca77d5d88b8f5a9037ecbd864f28da33184fcd6318e"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_14.25.57_256f89/docugit-linux-amd64"
      sha256 "4bc6b59be24753b7560f6f305fee786379f332f08293c1fec9cd10f726710d7b"
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
