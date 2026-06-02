# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.02_10.28.57_14a5fa"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_10.28.57_14a5fa/docugit-darwin-arm64"
      sha256 "bfc77e1bc78259310128c163227592f8fa999e29a1aff9ffacb9f1ff50ab5962"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_10.28.57_14a5fa/docugit-darwin-amd64"
      sha256 "050350b236f43d8d5c5c57a8d8ae4d4a145cf5314191e15238de91981d7e65c9"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_10.28.57_14a5fa/docugit-linux-arm64"
      sha256 "493d87285143bb3d772dac7b1aed827ef8a7d15ad2d1689b57563051c97e73e8"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.02_10.28.57_14a5fa/docugit-linux-amd64"
      sha256 "7ca6b1b798edc1f8d36b870780ec953688a3f2f8c1f781d49868d5f13a8e8169"
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
